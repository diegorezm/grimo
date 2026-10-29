import { DEFAULT_TIME_ZONE, USERNAME_REGEX, usernameFromName, yearOf } from "@grimo/core";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { emailEnabled } from "./env";
import { appError, notFound, unauthenticated } from "./errors";
import { isHidden } from "./safety";

type Ctx = QueryCtx | MutationCtx;

/** The account behind the auth identity, whatever its state (deleted, suspended…). */
async function viewerAccount(ctx: Ctx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return ctx.db
    .query("users")
    .withIndex("by_authId", (q) => q.eq("authId", identity.subject))
    .unique();
}

/** The signed-in reader, or null when signed out (or the account is deleted or suspended). */
export async function getViewer(ctx: Ctx): Promise<Doc<"users"> | null> {
  const viewer = await viewerAccount(ctx);
  return viewer && !viewer.deletedAt && !viewer.suspendedAt ? viewer : null;
}

/** The signed-in reader, or an UNAUTHENTICATED error. First line of every protected function. */
export async function requireViewer(ctx: Ctx): Promise<Doc<"users">> {
  const viewer = await viewerAccount(ctx);
  if (viewer?.suspendedAt) {
    throw appError(
      "FORBIDDEN",
      "Sua conta está suspensa. Fale com a gente se achar que é um erro.",
    );
  }
  if (!viewer || viewer.deletedAt) throw unauthenticated();
  return viewer;
}

/** The signed-in reader if on the moderation team; anyone else gets FORBIDDEN. */
export async function requireAdmin(ctx: Ctx): Promise<Doc<"users">> {
  const viewer = await requireViewer(ctx);
  if (viewer.role !== "admin") throw appError("FORBIDDEN", "Só a moderação pode ver isso.");
  return viewer;
}

/**
 * Like `requireViewer`, for the social features (comment, post, like, follow): the email must be
 * verified. Not enforced while the deployment can't send email (`emailEnabled`), since nobody
 * could verify. Reporting, blocking and everything about your own shelf don't need it.
 */
export async function requireVerifiedViewer(ctx: Ctx): Promise<Doc<"users">> {
  const viewer = await requireViewer(ctx);
  if (needsEmailVerification(viewer)) {
    throw appError(
      "EMAIL_UNVERIFIED",
      "Confirme seu email para comentar, curtir e seguir leitores.",
    );
  }
  return viewer;
}

/** True when this reader must verify their email before using the social features. */
export const needsEmailVerification = (viewer: Doc<"users">) =>
  emailEnabled() && viewer.emailVerified !== true;

/** A reader others can see (deleted, suspended and under-16 accounts are "not found"). */
export async function readerByUsername(ctx: Ctx, username: string) {
  const reader = await ctx.db
    .query("users")
    .withIndex("by_username", (q) => q.eq("username", username.toLowerCase()))
    .unique();
  if (!reader || isHidden(reader)) throw notFound("Leitor");
  return reader;
}

/** The reader using `username`, if any. */
export const userByUsername = (ctx: Ctx, username: string) =>
  ctx.db
    .query("users")
    .withIndex("by_username", (q) => q.eq("username", username))
    .first();

/** A free @ based on `name` (adds digits until nobody has it). */
export async function freeUsername(ctx: Ctx, name: string) {
  const base = usernameFromName(name);
  let handle = USERNAME_REGEX.test(base) ? base : "leitor";
  while (await userByUsername(ctx, handle)) {
    handle = `${base.slice(0, 25)}${Math.floor(Math.random() * 9000 + 1000)}`;
  }
  return handle;
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
  const year = yearOf(new Date(), timeZoneOf(user));
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

/** The zone a reader's months and years are counted in. */
export const timeZoneOf = (user: Doc<"users">) => user.timeZone ?? DEFAULT_TIME_ZONE;
