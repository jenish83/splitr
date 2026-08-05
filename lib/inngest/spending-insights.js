import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { cron } from "inngest";
import { inngest } from "./client";
import {
  brand,
  escapeHtml,
  insightContentStyleGuide,
  wrapSplitrEmail,
} from "./email-theme";

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

/** Strip markdown fences + force full-width so AI cards don't shrink */
function sanitizeInsightHtml(raw) {
  let html = String(raw ?? "")
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Expand any nested tables Gemini may have constrained
  html = html.replace(/<table\b([^>]*)>/gi, (_, attrs) => {
    let next = attrs
      .replace(/\swidth\s*=\s*["'][^"']*["']/gi, "")
      .replace(/\sstyle\s*=\s*["']([^"']*)["']/i, (m, style) => {
        const cleaned = String(style)
          .replace(/\bmax-width\s*:\s*[^;]+;?/gi, "")
          .replace(/\bwidth\s*:\s*[^;]+;?/gi, "");
        return ` style="width:100%;${cleaned}"`;
      });

    if (!/\sstyle\s*=/i.test(next)) {
      next += ' style="width:100%;"';
    }

    return `<table width="100%"${next}>`;
  });

  return html;
}

function buildCategorySummaryTable(expenses) {
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const categories = expenses.reduce((cats, e) => {
    const key = e.category ?? "uncategorised";
    cats[key] = (cats[key] ?? 0) + e.amount;
    return cats;
  }, {});

  const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]);

  const rows = sorted
    .map(
      ([name, amount], i) => `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid ${brand.borderSoft};font-family:${brand.font};font-size:14px;color:${brand.ink};background-color:${i % 2 === 0 ? brand.surface : brand.rowAlt};text-transform:capitalize;">
            ${escapeHtml(name)}
          </td>
          <td align="right" style="padding:12px 16px;border-bottom:1px solid ${brand.borderSoft};font-family:${brand.font};font-size:14px;color:${brand.ink};font-weight:600;background-color:${i % 2 === 0 ? brand.surface : brand.rowAlt};">
            $${amount.toFixed(2)}
          </td>
        </tr>`
    )
    .join("");

  return `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${brand.borderSoft};border-radius:6px;overflow:hidden;margin:0 0 24px;">
                <thead>
                  <tr>
                    <th align="left" style="padding:12px 16px;background-color:${brand.tableHead};background-image:${brand.gradientSoft};border-bottom:1px solid ${brand.borderSoft};font-family:${brand.font};font-size:12px;font-weight:700;color:${brand.greenDark};text-transform:uppercase;letter-spacing:0.05em;">
                      Category
                    </th>
                    <th align="right" style="padding:12px 16px;background-color:${brand.tableHead};background-image:${brand.gradientSoft};border-bottom:1px solid ${brand.borderSoft};font-family:${brand.font};font-size:12px;font-weight:700;color:${brand.greenDark};text-transform:uppercase;letter-spacing:0.05em;">
                      Spent
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                  <tr>
                    <td colspan="2" style="padding:0;border-top:1px solid ${brand.borderSoft};background-color:${brand.tableHead};background-image:${brand.gradientSoft};">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="padding:14px 16px;font-family:${brand.font};font-size:14px;font-weight:700;color:${brand.greenDark};">
                            Total spent
                          </td>
                          <td align="right" style="padding:14px 16px;font-family:${brand.font};font-size:16px;font-weight:700;color:${brand.greenDark};">
                            $${totalSpent.toFixed(2)}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>`;
}

function buildSpendingInsightsEmail(userName, expenses, insightHtml) {
  const bodyHtml = `
              ${buildCategorySummaryTable(expenses)}
              <p style="margin:0 0 16px;font-family:${brand.font};font-size:15px;line-height:1.5;color:${brand.muted};">
                Your personalized insights:
              </p>
              <div style="font-family:${brand.font};color:${brand.body};">
                ${insightHtml}
              </div>`;

  return wrapSplitrEmail({
    title: "Monthly spending insights",
    subtitle: "Monthly spending insights",
    preheader:
      "Your personalized Splitr spending analysis is ready — patterns, categories, and tips for next month.",
    greeting: userName,
    intro: "Here's your spending breakdown and personalized analysis for the past month:",
    bodyHtml,
    ctaLabel: "Open Splitr",
  });
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

    if (!users?.length) {
      return {
        processed: 0,
        success: 0,
        failed: 0,
        skipped: 0,
        message:
          "No users with expenses in the last 90 days. Add a recent expense, then invoke again.",
      };
    }

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
      if (!expenses?.length) {
        results.push({
          userId: user._id,
          success: false,
          skipped: true,
          reason: "no expenses in lookback window",
        });
        continue;
      }

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
        As a financial analyst, review this user's spending data and provide insightful observations and suggestions.
        Focus on spending patterns, category breakdowns, and actionable advice for better financial management.
        Use a friendly, encouraging tone.

        ${insightContentStyleGuide}

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
        const rawHtml = await step.run(`ai-${user._id}`, () =>
          generateInsightHtml(prompt)
        );
        const htmlBody = sanitizeInsightHtml(rawHtml);

        await step.run(`email-${user._id}`, () =>
          convex.action(api.email.sendEmail, {
            to: user.email,
            subject: "Your Monthly Spending Insights from Splitr",
            html: buildSpendingInsightsEmail(user.name, expenses, htmlBody),
            text: [
              `Hi ${user.name},`,
              "",
              "Here's your personalized spending analysis for the past month.",
              "Open Splitr to review your expenses and settle up.",
              "",
              "— The Splitr Team",
            ].join("\n"),
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
      failed: results.filter((r) => r.success === false && !r.skipped).length,
      skipped: results.filter((r) => r.skipped).length,
      results,
    };
  }
);
