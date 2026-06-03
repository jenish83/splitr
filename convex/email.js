import { v } from "convex/values";
import { action } from "./_generated/server";
import { Resend } from "resend";

const DEFAULT_FROM = "Splitr <onboarding@resend.dev>";

// Set RESEND_API_KEY in Convex: npx convex env set RESEND_API_KEY re_xxx
export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    text: v.optional(v.string()),
    apiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = args.apiKey ?? process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        "RESEND_API_KEY is missing. Set it with: npx convex env set RESEND_API_KEY re_xxx"
      );
    }

    const from = process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM;
    const resend = new Resend(apiKey);

    // Resend test domain only delivers to your account email. Optional redirect for dev.
    const redirectTo = process.env.RESEND_DEV_REDIRECT_TO;
    const to = redirectTo ?? args.to;
    const subject = redirectTo
      ? `${args.subject}`
      : args.subject;

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html: args.html,
      text: args.text,
    });

    if (error) {
      throw new Error(
        typeof error === "object" && error !== null && "message" in error
          ? String(error.message)
          : JSON.stringify(error)
      );
    }

    if (!data?.id) {
      throw new Error("Resend did not return an email id");
    }

    return { success: true, id: data.id };
  },
});
