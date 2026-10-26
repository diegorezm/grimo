import {
  CURRENT_LEGAL_VERSIONS,
  isOldEnough,
  LEGAL_DOCUMENTS,
  type LegalAcceptanceInput,
  legalAcceptanceSchema,
} from "@grimo/core";
import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { appError, parse } from "./errors";

/** Where an acceptance happened (stored as evidence). */
export const legalSource = v.union(v.literal("web"), v.literal("ios"), v.literal("android"));

/** Args of every function that records an acceptance. */
export const legalAcceptanceArgs = {
  accepted: v.boolean(),
  termsVersion: v.string(),
  privacyVersion: v.string(),
  birthDate: v.optional(v.string()),
  source: legalSource,
};

/** Where the reader stands: what the apps must still ask before opening normally. */
export async function legalStatus(ctx: QueryCtx | MutationCtx, user: Doc<"users">) {
  const latest = await Promise.all(
    LEGAL_DOCUMENTS.map((document) =>
      ctx.db
        .query("legalAcceptances")
        .withIndex("by_user_document", (q) => q.eq("userId", user._id).eq("document", document))
        .order("desc")
        .first(),
    ),
  );
  return {
    /** Never accepted, or accepted an older version of a document. */
    needsAcceptance: LEGAL_DOCUMENTS.some(
      (document, i) => latest[i]?.version !== CURRENT_LEGAL_VERSIONS[document],
    ),
    /** Hasn't declared being 16+ yet (accounts from before the age rule). */
    needsAge: !user.ageConfirmedAt,
    /** Declared under 16: the apps only offer to delete the account. */
    underage: Boolean(user.ageRejectedAt),
  };
}

export type AcceptanceResult = { ok: true } | { ok: false; reason: "underage" };

/**
 * Records the acceptance of the current Terms and Privacy Policy and, when given, the age
 * declaration. Under 16 marks the account (it is hidden and can only be deleted) and returns
 * `underage` instead of throwing, so that mark is saved.
 */
export async function acceptLegal(
  ctx: MutationCtx,
  user: Doc<"users">,
  args: Omit<LegalAcceptanceInput, "accepted"> & { accepted: boolean; source: string },
): Promise<AcceptanceResult> {
  if (user.ageRejectedAt) return { ok: false, reason: "underage" };
  const input = parse(legalAcceptanceSchema, args);
  if (
    input.termsVersion !== CURRENT_LEGAL_VERSIONS.terms ||
    input.privacyVersion !== CURRENT_LEGAL_VERSIONS.privacy
  ) {
    throw appError("INVALID", "Os termos foram atualizados. Recarregue a página e leia de novo.");
  }
  const now = Date.now();
  if (!user.ageConfirmedAt) {
    if (!input.birthDate) throw appError("INVALID", "Informe sua data de nascimento");
    if (!isOldEnough(input.birthDate, now)) {
      await ctx.db.patch(user._id, { ageRejectedAt: now });
      return { ok: false, reason: "underage" };
    }
    await ctx.db.patch(user._id, { ageConfirmedAt: now });
  }
  for (const document of LEGAL_DOCUMENTS) {
    await ctx.db.insert("legalAcceptances", {
      userId: user._id,
      document,
      version: CURRENT_LEGAL_VERSIONS[document],
      acceptedAt: now,
      source: args.source,
    });
  }
  return { ok: true };
}
