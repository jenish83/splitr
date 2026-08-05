import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { cron } from "inngest";
import { inngest } from "./client";
import { brand, escapeHtml, wrapSplitrEmail } from "./email-theme";

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

function buildPaymentReminderHtml(userName, debts) {
  const total = debts.reduce((sum, d) => sum + d.amount, 0);

  const rows = debts
    .map(
      (d, i) => `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid ${brand.borderSoft};font-family:${brand.font};font-size:14px;color:${brand.ink};background-color:${i % 2 === 0 ? brand.surface : brand.rowAlt};">
            ${escapeHtml(d.name)}
          </td>
          <td align="right" style="padding:12px 16px;border-bottom:1px solid ${brand.borderSoft};font-family:${brand.font};font-size:14px;color:${brand.ink};font-weight:600;background-color:${i % 2 === 0 ? brand.surface : brand.rowAlt};">
            $${d.amount.toFixed(2)}
          </td>
        </tr>`
    )
    .join("");

  const bodyHtml = `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${brand.borderSoft};border-radius:6px;overflow:hidden;">
                <thead>
                  <tr>
                    <th align="left" style="padding:12px 16px;background-color:${brand.tableHead};background-image:${brand.gradientSoft};border-bottom:1px solid ${brand.borderSoft};font-family:${brand.font};font-size:12px;font-weight:700;color:${brand.greenDark};text-transform:uppercase;letter-spacing:0.05em;">
                      Pay to
                    </th>
                    <th align="right" style="padding:12px 16px;background-color:${brand.tableHead};background-image:${brand.gradientSoft};border-bottom:1px solid ${brand.borderSoft};font-family:${brand.font};font-size:12px;font-weight:700;color:${brand.greenDark};text-transform:uppercase;letter-spacing:0.05em;">
                      Amount
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
                            Total owed
                          </td>
                          <td align="right" style="padding:14px 16px;font-family:${brand.font};font-size:16px;font-weight:700;color:${brand.greenDark};">
                            $${total.toFixed(2)}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
              <p style="margin:24px 0 0;font-family:${brand.font};font-size:14px;line-height:1.5;color:${brand.muted};">
                Please settle these balances when you can. Log in to Splitr to record a payment or settle up.
              </p>`;

  return wrapSplitrEmail({
    title: "Payment reminder",
    subtitle: "Payment reminder",
    preheader: `You owe $${total.toFixed(2)} across ${debts.length} balance${debts.length === 1 ? "" : "s"} on Splitr.`,
    greeting: userName,
    intro: "You have the following outstanding balances:",
    bodyHtml,
  });
}

function buildPaymentReminderText(userName, debts) {
  const total = debts.reduce((sum, d) => sum + d.amount, 0);
  return [
    `Hi ${userName},`,
    "",
    "You have the following outstanding balances:",
    ...debts.map((d) => `  ${d.name}: $${d.amount.toFixed(2)}`),
    `  Total: $${total.toFixed(2)}`,
    "",
    "Please settle these balances when you can.",
    "",
    "— The Splitr Team",
  ].join("\n");
}

export const paymentReminders = inngest.createFunction(
  {
    id: "send-payment-reminders",
    triggers: [
      cron("0 10 * * *"), // daily at 10 AM UTC
      { event: "splitr/payment-reminder.send" }, // manual test from Inngest Dev UI
    ],
  },
  async ({ step }) => {
    /* 1. fetch all users that still owe money */
    const users = await step.run("fetch‑debts", () =>
      convex.query(api.inngest.getUsersWithOutstandingDebts)
    );

    /* 2. build & send one e‑mail per user */
    const results = await step.run("send‑emails", async () => {
      return Promise.all(
        users.map(async (u) => {
          if (!u.email) {
            return { userId: u._id, skipped: true, reason: "no email" };
          }

          if (!u.debts?.length) {
            return { userId: u._id, skipped: true };
          }

          const html = buildPaymentReminderHtml(u.name, u.debts);
          const text = buildPaymentReminderText(u.name, u.debts);

          try {
            const sent = await convex.action(api.email.sendEmail, {
              to: u.email,
              subject: "You have pending payments on Splitr",
              html,
              text,
            });
            return { userId: u._id, email: u.email, success: true, id: sent.id };
          } catch (err) {
            return {
              userId: u._id,
              email: u.email,
              success: false,
              error: err?.message ?? String(err),
            };
          }
        })
      );
    });

    return {
      processed: results.length,
      successes: results.filter((r) => r.success).length,
      failures: results.filter((r) => r.success === false).length,
    };
  }
);
