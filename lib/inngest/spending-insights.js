import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { cron } from "inngest";
import { inngest } from "./client";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL_PRIMARY = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
// 2.0/1.5 short names are invalid or shut down on v1beta (Jun 2026)
const MODEL_FALLBACKS = [
  "gemini-2.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
];

function shouldTryNextModel(err) {
  const msg = err?.message ?? String(err);
  return /503|429|500|404|not found|unavailable|high demand/i.test(msg);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateInsightHtml(prompt) {
  const models = [MODEL_PRIMARY, ...MODEL_FALLBACKS.filter((m) => m !== MODEL_PRIMARY)];

  for (let i = 0; i < models.length; i++) {
    try {
      const model = genAI.getGenerativeModel({ model: models[i] });
      const result = await model.generateContent(prompt);
      return result.response.candidates[0]?.content.parts[0]?.text ?? "";
    } catch (err) {
      if (!shouldTryNextModel(err) || i === models.length - 1) throw err;
      await sleep(1000 * (i + 1));
    }
  }
}

export const spendingInsights = inngest.createFunction(
  {
    id: "generate-spending-insights",
    retries: 5,
    triggers: [
      cron("0 8 1 * *"), // 1st of every month at 08:00 UTC
      { event: "splitr/spending-insights.send" }, // manual test from Inngest Dev UI
    ],
  },
  async ({ step }) => {
    const users = await step.run("fetch-users-with-expenses", () =>
      convex.query(api.inngest.getUsersWithExpenses)
    );

    const results = [];

    for (const user of users) {
      if (!user.email) {
        results.push({
          userId: user._id,
          success: false,
          skipped: true,
          reason: "no email",
        });
        continue;
      }

      const expenses = await step.run(`expenses-${user._id}`, () =>
        convex.query(api.inngest.getUserMonthlyExpenses, { userId: user._id })
      );
      if (!expenses?.length) continue;

      const expenseData = JSON.stringify({
        expenses,
        totalSpent: expenses.reduce((sum, e) => sum + e.amount, 0),
        categories: expenses.reduce((cats, e) => {
          const key = e.category ?? "uncategorised";
          cats[key] = (cats[key] ?? 0) + e.amount;
          return cats;
        }, {}),
      });

      const prompt = `
As a financial analyst, review this user's spending data for the past month and provide insightful observations and suggestions.
Focus on spending patterns, category breakdowns, and actionable advice for better financial management.
Use a friendly, encouraging tone. Format your response in HTML for an email.

User spending data:
${expenseData}

Provide your analysis in these sections:
1. Monthly Overview
2. Top Spending Categories
3. Unusual Spending Patterns (if any)
4. Saving Opportunities
5. Recommendations for Next Month
      `.trim();

      try {
        const htmlBody = await step.run(`ai-${user._id}`, () =>
          generateInsightHtml(prompt)
        );

        await step.run(`email-${user._id}`, () =>
          convex.action(api.email.sendEmail, {
            to: user.email,
            subject: "Your Monthly Spending Insights",
            html: `
              <h1>Your Monthly Financial Insights</h1>
              <p>Hi ${user.name},</p>
              <p>Here's your personalized spending analysis for the past month:</p>
              ${htmlBody}
            `,
          })
        );

        results.push({ userId: user._id, success: true });
      } catch (err) {
        results.push({
          userId: user._id,
          success: false,
          error: err?.message ?? String(err),
        });
      }
    }

    return {
      processed: results.length,
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => r.success === false).length,
    };
  }
);
