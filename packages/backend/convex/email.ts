import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { emailEnabled, env } from "./model/env";

/**
 * Sends a transactional email through Resend (plain `fetch`, no SDK). Without `RESEND_API_KEY`
 * and `EMAIL_FROM` it only logs the message (the link is in it), which is what local dev uses.
 */
export const send = internalAction({
  args: { to: v.string(), subject: v.string(), text: v.string(), html: v.string() },
  handler: async (_ctx, message): Promise<null> => {
    if (!emailEnabled()) {
      console.log(`[email] to=${message.to} subject="${message.subject}"\n${message.text}`);
      return null;
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: env.EMAIL_FROM, ...message }),
      signal: AbortSignal.timeout(10_000),
    });
    // Retrying a send we can't be sure failed could duplicate it: log and move on.
    if (!res.ok) console.error(`[email] Resend answered ${res.status}: ${await res.text()}`);
    return null;
  },
});
