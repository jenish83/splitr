/** Splitr brand tokens — matches landing page / green→teal gradient UI */
export const brand = {
  green: "#16a34a", // green-600
  teal: "#14b8a6", // teal-500
  greenDark: "#15803d",
  greenSoft: "#dcfce7", // green-100 — light
  greenMuted: "#bbf7d0", // green-200
  tealSoft: "#ccfbf1", // teal-100
  ink: "#111827",
  body: "#374151",
  muted: "#6b7280",
  faint: "#9ca3af",
  border: "#e5e7eb",
  borderSoft: "#d1fae5", // light green border
  surface: "#ffffff",
  canvas: "#f3f4f6",
  rowAlt: "#f0fdf4", // green-50 — lighter table stripe
  tableHead: "#ecfdf5", // emerald-50 — lighter header
  font: "Arial,Helvetica,sans-serif",
  /** App gradient: from-green-600 to-teal-500 */
  gradient: "linear-gradient(90deg, #16a34a 0%, #14b8a6 100%)",
  gradientSoft: "linear-gradient(90deg, #dcfce7 0%, #ccfbf1 100%)",
};

export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  );
}

/**
 * Same layout as the previous payment-reminder email:
 * green header bar → white body → optional CTA → light footer.
 */
export function wrapSplitrEmail({
  title,
  subtitle,
  preheader,
  greeting,
  intro,
  bodyHtml,
  ctaLabel,
  ctaHref,
  footerNote,
}) {
  const href = ctaHref || appUrl();
  const cta = ctaLabel
    ? `
              <p style="margin:24px 0 0;">
                <a href="${escapeHtml(href)}" style="display:inline-block;background-color:${brand.green};background-image:${brand.gradient};color:#ffffff;font-family:${brand.font};font-size:14px;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:8px;line-height:1;">
                  ${escapeHtml(ctaLabel)}
                </a>
              </p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <!--[if mso]><style>body,table,td{font-family:Arial,Helvetica,sans-serif!important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${brand.canvas};">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(preheader)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${brand.canvas};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="720" cellpadding="0" cellspacing="0" border="0" style="max-width:720px;width:100%;min-width:320px;background-color:${brand.surface};border-radius:8px;border:1px solid ${brand.border};overflow:hidden;">
          <tr>
            <td style="padding:28px 40px;background-color:${brand.green};background-image:${brand.gradient};border-radius:8px 8px 0 0;">
              <h1 style="margin:0;font-family:${brand.font};font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">
                Splitr
              </h1>
              <p style="margin:8px 0 0;font-family:${brand.font};font-size:15px;color:#ecfdf5;">
                ${escapeHtml(subtitle || title)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px;font-family:${brand.font};font-size:16px;line-height:1.5;color:${brand.body};">
                Hi ${escapeHtml(greeting)},
              </p>
              ${
                intro
                  ? `<p style="margin:0 0 24px;font-family:${brand.font};font-size:15px;line-height:1.5;color:${brand.muted};">
                ${escapeHtml(intro)}
              </p>`
                  : ""
              }
              ${bodyHtml}
              ${cta}
            </td>
          </tr>
          <tr>
            <td style="padding:22px 40px;background-color:${brand.rowAlt};border-top:1px solid ${brand.borderSoft};border-radius:0 0 8px 8px;">
              <p style="margin:0;font-family:${brand.font};font-size:13px;color:${brand.faint};">
                ${footerNote || "Thank you for using Splitr.<br />— The Splitr Team"}
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

/** Inline styles Gemini should use inside insight sections — match payment-reminder table */
export const insightContentStyleGuide = `
Use ONLY inline CSS (email-safe). Do NOT include <html>, <head>, <body>, <h1>, or outer wrappers.
Do NOT invent totals/tables for categories (those are already shown above). Focus on narrative insights.
Do NOT set fixed widths, max-width, or shrink wrappers. Every table MUST be width="100%" with style including width:100%.

Style each of the 5 sections like this full-width card (copy structure exactly):
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border:1px solid #d1fae5;border-radius:6px;overflow:hidden;margin:0 0 16px;">
  <tr>
    <td style="padding:12px 16px;background-color:#ecfdf5;background-image:linear-gradient(90deg,#dcfce7 0%,#ccfbf1 100%);border-bottom:1px solid #d1fae5;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:0.05em;">
      SECTION TITLE
    </td>
  </tr>
  <tr>
    <td style="padding:16px 18px;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#6b7280;">
      Paragraphs and <ul style="margin:8px 0 0;padding-left:20px;"><li style="margin:0 0 6px;"> items </li></ul>. Emphasize amounts with <strong style="color:#111827;font-weight:700;">$X.XX</strong>.
    </td>
  </tr>
</table>

Rules:
- Every section card must span the full email width (width="100%" / width:100%)
- Never nest a narrow table or div inside another card
- Section title text only in the header cell (no extra heading tags inside)
- Body text color #6b7280; strong/amounts #111827
- Soft green borders #d1fae5 only — no dark or purple colors
- No markdown, no code fences
`.trim();
