import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

/** How many blocks a reader can have; plenty, and keeps `blockedIds` a bounded read. */
export const MAX_BLOCKS = 1000;

/** Whether the suspension is in force: set, and not a temporary one that already ended. */
export const isSuspended = (
  user: Pick<Doc<"users">, "suspendedAt" | "suspendedUntil">,
  now = Date.now(),
) => Boolean(user.suspendedAt) && (user.suspendedUntil === undefined || user.suspendedUntil > now);

/** Readers nobody else sees: deleted, suspended, or who declared being under 16. */
export const isHidden = (
  user: Pick<Doc<"users">, "deletedAt" | "suspendedAt" | "suspendedUntil" | "ageRejectedAt">,
) => Boolean(user.deletedAt || isSuspended(user) || user.ageRejectedAt);

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

/**
 * Private profile ("só seguidores veem minhas leituras"): whether `viewerId` may see `user`'s
 * shelf, stats, activity, posts and lists. Yes for public readers, for the reader themself and
 * for approved followers.
 */
export async function canSeeReader(ctx: Ctx, viewerId: Id<"users"> | null, user: Doc<"users">) {
  if (!user.isPrivate || viewerId === user._id) return true;
  if (!viewerId) return false;
  const follow = await ctx.db
    .query("follows")
    .withIndex("by_follower_following", (q) =>
      q.eq("followerId", viewerId).eq("followingId", user._id),
    )
    .unique();
  return follow !== null;
}

/** `canSeeReader` for many readers at once (feeds, reviews), each follow looked up once. */
export function readerVisibility(ctx: Ctx, viewerId: Id<"users"> | null) {
  const known = new Map<Id<"users">, Promise<boolean>>();
  return (user: Doc<"users">) => {
    if (!user.isPrivate) return Promise.resolve(true);
    let seen = known.get(user._id);
    if (!seen) {
      seen = canSeeReader(ctx, viewerId, user);
      known.set(user._id, seen);
    }
    return seen;
  };
}

/** `requesterId`'s pending request to follow `targetId`, if any. */
export function followRequest(ctx: Ctx, requesterId: Id<"users">, targetId: Id<"users">) {
  return ctx.db
    .query("followRequests")
    .withIndex("by_requester_target", (q) =>
      q.eq("requesterId", requesterId).eq("targetId", targetId),
    )
    .unique();
}
