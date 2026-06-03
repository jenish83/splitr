import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { cron } from "inngest";
import { inngest } from "./client";

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildPaymentReminderHtml(userName, debts) {
  const total = debts.reduce((sum, d) => sum + d.amount, 0);

  const rows = debts
    .map(
      (d, i) => `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111827;background-color:${i % 2 === 0 ? "#ffffff" : "#f9fafb"};">
            ${escapeHtml(d.name)}
          </td>
          <td align="right" style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111827;font-weight:600;background-color:${i % 2 === 0 ? "#ffffff" : "#f9fafb"};">
            $${d.amount.toFixed(2)}
          </td>
        </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Reminder</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;border:1px solid #e5e7eb;">
          <tr>
            <td style="padding:24px 32px;background-color:#111827;border-radius:8px 8px 0 0;">
              <h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">
                Splitr
              </h1>
              <p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#d1d5db;">
                Payment reminder
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#374151;">
                Hi ${escapeHtml(userName)},
              </p>
              <p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#6b7280;">
                You have the following outstanding balances:
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
                <thead>
                  <tr>
                    <th align="left" style="padding:12px 16px;background-color:#f3f4f6;border-bottom:2px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">
                      Pay to
                    </th>
                    <th align="right" style="padding:12px 16px;background-color:#f3f4f6;border-bottom:2px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                  <tr>
                    <td style="padding:14px 16px;border-top:2px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#111827;background-color:#f9fafb;">
                      Total owed
                    </td>
                    <td align="right" style="padding:14px 16px;border-top:2px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;color:#111827;background-color:#f9fafb;">
                      $${total.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p style="margin:24px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#6b7280;">
                Please settle these balances when you can. Log in to Splitr to record a payment or settle up.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 8px 8px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#9ca3af;">
                Thank you for using Splitr.<br />
                — The Splitr Team
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
