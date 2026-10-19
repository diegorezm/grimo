import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { notFound, unauthenticated } from "./errors";

type Ctx = QueryCtx | MutationCtx;

/** The signed-in reader, or null when signed out. */
export async function getViewer(ctx: Ctx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return ctx.db
    .query("users")
    .withIndex("by_authId", (q) => q.eq("authId", identity.subject))
    .unique();
}

/** The signed-in reader, or an UNAUTHENTICATED error. First line of every protected function. */
export async function requireViewer(ctx: Ctx): Promise<Doc<"users">> {
  const viewer = await getViewer(ctx);
  if (!viewer) throw unauthenticated();
  return viewer;
}

export async function readerByUsername(ctx: Ctx, username: string) {
  const reader = await ctx.db
    .query("users")
    .withIndex("by_username", (q) => q.eq("username", username.toLowerCase()))
    .unique();
  if (!reader) throw notFound("Leitor");
  return reader;
}

/** Who wrote a post / did an activity. */
export const authorOf = (user: Doc<"users">) => ({
  id: user._id,
  name: user.name,
  username: user.username,
  image: user.image,
});

export async function isFollowing(ctx: Ctx, followerId: Id<"users">, followingId: Id<"users">) {
  const row = await ctx.db
    .query("follows")
    .withIndex("by_follower_following", (q) =>
      q.eq("followerId", followerId).eq("followingId", followingId),
    )
    .unique();
  return row !== null;
}

/** Public profile: reader + current-year goal + follow counts. */
export async function profileOf(ctx: Ctx, user: Doc<"users">) {
  const year = new Date().getUTCFullYear();
  const goal = await ctx.db
    .query("readingGoals")
    .withIndex("by_user_year", (q) => q.eq("userId", user._id).eq("year", year))
    .unique();
  return {
    id: user._id,
    name: user.name,
    username: user.username,
    image: user.image,
    bio: user.bio,
    favoriteGenres: user.favoriteGenres,
    yearlyGoal: goal?.target ?? null,
    followers: user.followers,
    following: user.following,
  };
}

/**
 * A reader in a list (search, suggestions, followers…), from the viewer's point of view, with a
 * peek at their shelf: book count, the three latest covers and what they are reading now.
 */
export async function readerCard(ctx: Ctx, user: Doc<"users">, viewerId: Id<"users"> | null) {
  const [recent, reading, following, followsYou] = await Promise.all([
    ctx.db
      .query("shelfEntries")
      .withIndex("by_user_updated", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(8),
    ctx.db
      .query("shelfEntries")
      .withIndex("by_user_status_updated", (q) => q.eq("userId", user._id).eq("status", "reading"))
      .order("desc")
      .first(),
    viewerId ? isFollowing(ctx, viewerId, user._id) : false,
    viewerId ? isFollowing(ctx, user._id, viewerId) : false,
  ]);
  const books = await Promise.all(recent.map((entry) => ctx.db.get(entry.bookId)));
  const readingBook = reading ? await ctx.db.get(reading.bookId) : null;
  return {
    id: user._id,
    name: user.name,
    username: user.username,
    image: user.image,
    bio: user.bio,
    followers: user.followers,
    bookCount: user.bookCount,
    covers: books.flatMap((book) => (book?.coverUrl ? [book.coverUrl] : [])).slice(0, 3),
    readingNow: readingBook?.title ?? null,
    isFollowing: following,
    followsYou,
  };
}
