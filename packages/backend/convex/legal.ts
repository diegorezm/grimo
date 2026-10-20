import { mutation } from "./_generated/server";
import { type AcceptanceResult, acceptLegal, legalAcceptanceArgs } from "./model/legal";
import { requireViewer } from "./model/readers";

/**
 * Agrees to the current Terms and Privacy Policy (and declares the age, when not done yet).
 * Asked by the apps when `me.legal.needsAcceptance` (a document changed, or an account from
 * before the terms existed). New accounts do it in `users.completeSetup`.
 */
export const accept = mutation({
  args: legalAcceptanceArgs,
  handler: async (ctx, args): Promise<AcceptanceResult> =>
    acceptLegal(ctx, await requireViewer(ctx), args),
});
