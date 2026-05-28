import { Inngest } from "inngest";


export const inngest = new Inngest({
  id: "splitr",
  // Defaulting to dev mode locally prevents signature verification errors
  // when running against the Inngest Dev Server.
  isDev: process.env.NODE_ENV !== "production" || process.env.INNGEST_DEV === "1",
});