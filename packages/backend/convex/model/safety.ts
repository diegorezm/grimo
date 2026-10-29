import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

/** How many blocks a reader can have; plenty, and keeps `blockedIds` a bounded read. */
export const MAX_BLOCKS = 1000;

/** Readers nobody else sees: deleted, suspended, or who declared being under 16. */
export const isHidden = (user: Pick<Doc<"users">, "deletedAt" | "suspendedAt" | "ageRejectedAt">) =>
  Boolean(user.deletedAt || user.suspendedAt || user.ageRejectedAt);

/** Whether `blockerId` blocked `blockedId` (one direction). */
export async function hasBlocked(ctx: Ctx, blockerId: Id<"users">, blockedId: Id<"users">) {
  const row = await ctx.db
    .query("blocks")
    .withIndex("by_blocker_blocked", (q) => q.eq("blockerId", blockerId).eq("blockedId", blockedId))
    .unique();
  return row !== null;
}

/** Whether either of the two blocked the other. */
export async function isBlockedBetween(ctx: Ctx, a: Id<"users">, b: Id<"users">) {
  const [ab, ba] = await Promise.all([hasBlocked(ctx, a, b), hasBlocked(ctx, b, a)]);
  return ab || ba;
}

/** Everyone `viewerId` blocked or was blocked by: their content is hidden from the viewer. */
export async function blockedIds(ctx: Ctx, viewerId: Id<"users"> | null) {
  if (!viewerId) return new Set<Id<"users">>();
  const [mine, theirs] = await Promise.all([
    ctx.db
      .query("blocks")
      .withIndex("by_blocker_blocked", (q) => q.eq("blockerId", viewerId))
      .take(MAX_BLOCKS),
    ctx.db
      .query("blocks")
      .withIndex("by_blocked", (q) => q.eq("blockedId", viewerId))
      .take(MAX_BLOCKS),
  ]);
  return new Set<Id<"users">>([
    ...mine.map((row) => row.blockedId),
    ...theirs.map((row) => row.blockerId),
  ]);
}

/**
 * Whether `viewerId` may see this book: Open Library books and approved hand-added ones are
 * public; one still in review (or rejected) only to whoever added it.
 */
export const isBookVisible = (book: Doc<"books">, viewerId: Id<"users"> | null) =>
  book.reviewStatus === undefined ||
  book.reviewStatus === "approved" ||
  book.createdBy === viewerId;
