import {
  avatarProblem,
  setupProfileSchema,
  USERNAME_REGEX,
  updateProfileSchema,
} from "@grimo/core";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, type QueryCtx, query } from "./_generated/server";
import { listActivities, recordActivity } from "./model/content";
import { appError, notFound, parse } from "./model/errors";
import {
  type AcceptanceResult,
  acceptLegal,
  legalAcceptanceArgs,
  legalStatus,
} from "./model/legal";
import { listLimit } from "./model/limits";
import {
  getViewer,
  isFollowing,
  profileOf,
  readerByUsername,
  readerCard,
  requireViewer,
  userByUsername,
} from "./model/readers";
import { blockedIds, hasBlocked, isBlockedBetween, isHidden } from "./model/safety";
import { withBooks } from "./model/shelves";
import { yearOverview } from "./model/stats";

/** The signed-in reader's profile. */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    // New accounts confirm name and @ (and agree to the terms) in the onboarding before anything
    // else; older accounts are asked again when a legal document changes (`legal`).
    return {
      ...(await profileOf(ctx, viewer)),
      needsSetup: viewer.setupDone === false,
      legal: await legalStatus(ctx, viewer),
    };
  },
});

/** Whether `username` is valid and free (your own @ counts as free). For live feedback. */
export const usernameAvailable = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const username = args.username.trim().toLowerCase();
    if (!USERNAME_REGEX.test(username)) return { valid: false, available: false };
    const [owner, viewer] = await Promise.all([userByUsername(ctx, username), getViewer(ctx)]);
    return { valid: true, available: !owner || owner._id === viewer?._id };
  },
});

/**
 * Onboarding: the reader's name and @, the age declaration and the acceptance of the Terms and
 * Privacy Policy. Ends the setup (`needsSetup` turns false), unless the reader is under 16.
 */
export const completeSetup = mutation({
  args: { name: v.string(), username: v.string(), ...legalAcceptanceArgs },
  handler: async (
    ctx,
    { name: rawName, username: rawUsername, ...legal },
  ): Promise<AcceptanceResult> => {
    const viewer = await requireViewer(ctx);
    const { name, username } = parse(setupProfileSchema, { name: rawName, username: rawUsername });
    const owner = await userByUsername(ctx, username);
    if (owner && owner._id !== viewer._id) {
      throw appError("INVALID", "Esse @ já tem dono. Que tal outro?");
    }
    const result = await acceptLegal(ctx, viewer, legal);
    if (!result.ok) return result;
    await ctx.db.patch(viewer._id, {
      name,
      username,
      searchText: `${name} ${username}`,
      setupDone: true,
    });
    return result;
  },
});

/** Profile fields + the current year's reading goal. Used by the seed too. */
export async function updateProfile(ctx: MutationCtx, user: Doc<"users">, patch: unknown) {
  const { name, bio, favoriteGenres, yearlyGoal } = parse(updateProfileSchema, patch);
  const fields: Partial<Doc<"users">> = {};
  if (name !== undefined) {
    fields.name = name;
    fields.searchText = `${name} ${user.username}`;
  }
  if (bio !== undefined) fields.bio = bio;
  if (favoriteGenres !== undefined) fields.favoriteGenres = favoriteGenres;
  if (Object.keys(fields).length > 0) await ctx.db.patch(user._id, fields);

  if (yearlyGoal !== undefined) {
    const year = new Date().getUTCFullYear();
    const goal = await ctx.db
      .query("readingGoals")
      .withIndex("by_user_year", (q) => q.eq("userId", user._id).eq("year", year))
      .unique();
    if (yearlyGoal === null) {
      if (goal) await ctx.db.delete(goal._id);
    } else if (goal) {
      await ctx.db.patch(goal._id, { target: yearlyGoal });
    } else {
      await ctx.db.insert("readingGoals", { userId: user._id, year, target: yearlyGoal });
    }
  }
}

export const updateMe = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.union(v.string(), v.null())),
    favoriteGenres: v.optional(v.array(v.string())),
    yearlyGoal: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    await updateProfile(ctx, viewer, args);
    return profileOf(ctx, (await ctx.db.get(viewer._id))!);
  },
});

/** Step 1 of a profile photo upload: a short-lived URL the client POSTs the file to. */
export const avatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireViewer(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

/**
 * Step 2: makes the uploaded file the reader's photo. Checks type and size (the upload URL
 * accepts anything), deletes the previous upload and returns the updated profile.
 */
export const setAvatar = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const viewer = await requireViewer(ctx);
    const file = await ctx.db.system.get(storageId);
    if (!file) throw notFound("Foto");
    const problem = avatarProblem({ contentType: file.contentType ?? null, size: file.size });
    // Throwing rolls the whole mutation back, so a rejected file is just left unreferenced.
    if (problem) throw appError("INVALID", problem);
    const url = await ctx.storage.getUrl(storageId);
    if (viewer.avatarStorageId && viewer.avatarStorageId !== storageId) {
      await ctx.storage.delete(viewer.avatarStorageId);
    }
    await ctx.db.patch(viewer._id, { image: url, avatarStorageId: storageId });
    return profileOf(ctx, (await ctx.db.get(viewer._id))!);
  },
});

/** Removes the uploaded photo (the profile falls back to initials). */
export const removeAvatar = mutation({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    if (viewer.avatarStorageId) await ctx.storage.delete(viewer.avatarStorageId);
    await ctx.db.patch(viewer._id, { image: null, avatarStorageId: undefined });
    return profileOf(ctx, (await ctx.db.get(viewer._id))!);
  },
});

/** The books shown on a profile: reading now, favorites (best rated reads) and the total. */
async function profileBooks(ctx: QueryCtx, user: Doc<"users">) {
  const entries = await ctx.db
    .query("shelfEntries")
    .withIndex("by_user_updated", (q) => q.eq("userId", user._id))
    .order("desc")
    .collect();
  const rows = await withBooks(
    ctx,
    entries.filter((entry) => entry.status === "reading" || entry.status === "read"),
  );
  const reading = rows.filter(({ entry }) => entry.status === "reading");
  const favorites = rows
    .filter(({ entry }) => entry.status === "read" && entry.rating)
    .sort((a, b) => (b.entry.rating ?? 0) - (a.entry.rating ?? 0))
    .slice(0, 10);
  const covers = rows.flatMap(({ book }) => (book.coverUrl ? [book.coverUrl] : [])).slice(0, 24);
  return { reading, favorites, covers, total: entries.length };
}

/** A reader's public page. Works signed out, so profile links can be shared anywhere. */
export const byUsername = query({
  args: { username: v.string(), year: v.number() },
  handler: async (ctx, { username, year }) => {
    const [reader, viewer] = await Promise.all([readerByUsername(ctx, username), getViewer(ctx)]);
    // Whoever blocked you doesn't exist for you; whoever you blocked shows "Desbloquear".
    if (viewer && (await hasBlocked(ctx, reader._id, viewer._id))) throw notFound("Leitor");
    const [profile, stats, books, following, followsYou, blockedByMe] = await Promise.all([
      profileOf(ctx, reader),
      yearOverview(ctx, reader._id, year),
      profileBooks(ctx, reader),
      viewer ? isFollowing(ctx, viewer._id, reader._id) : false,
      viewer ? isFollowing(ctx, reader._id, viewer._id) : false,
      viewer ? hasBlocked(ctx, viewer._id, reader._id) : false,
    ]);
    return { profile, stats, books, isFollowing: following, followsYou, blockedByMe };
  },
});

/** A reader's own activity (posts, progress, finished books…), newest first. Public. */
export const activity = query({
  args: { username: v.string(), limit: v.number() },
  handler: async (ctx, { username, limit }) => {
    const [reader, viewer] = await Promise.all([readerByUsername(ctx, username), getViewer(ctx)]);
    if (viewer && (await isBlockedBetween(ctx, viewer._id, reader._id))) {
      return { items: [], hasMore: false };
    }
    return listActivities(ctx, [reader._id], viewer?._id ?? null, listLimit(limit));
  },
});

/** Who follows a reader (`followers`), or whom they follow (`following`), newest first. */
export const connections = query({
  args: {
    username: v.string(),
    kind: v.union(v.literal("followers"), v.literal("following")),
    limit: v.number(),
  },
  handler: async (ctx, { username, kind, limit }) => {
    const [reader, viewer] = await Promise.all([readerByUsername(ctx, username), getViewer(ctx)]);
    const blocked = await blockedIds(ctx, viewer?._id ?? null);
    const take = listLimit(limit);
    const rows =
      kind === "followers"
        ? await ctx.db
            .query("follows")
            .withIndex("by_following", (q) => q.eq("followingId", reader._id))
            .order("desc")
            .take(take + 1)
        : await ctx.db
            .query("follows")
            .withIndex("by_follower", (q) => q.eq("followerId", reader._id))
            .order("desc")
            .take(take + 1);
    const cards = await Promise.all(
      rows.slice(0, take).map(async (row) => {
        const other = await ctx.db.get(kind === "followers" ? row.followerId : row.followingId);
        return other && !isHidden(other) && !blocked.has(other._id)
          ? { ...(await readerCard(ctx, other, viewer?._id ?? null)), since: row._creationTime }
          : null;
      }),
    );
    return { items: cards.filter((card) => card !== null), hasMore: rows.length > take };
  },
});

/** Readers whose name or @username matches `q` (full-text, prefix on the last word). */
export const search = query({
  args: { q: v.string(), limit: v.number() },
  handler: async (ctx, { q, limit }) => {
    const viewer = await requireViewer(ctx);
    const text = q.trim().slice(0, 60);
    if (!text) return { items: [], hasMore: false };
    const take = listLimit(limit);
    const matches = await ctx.db
      .query("users")
      .withSearchIndex("search", (s) => s.search("searchText", text))
      .take(take + 2);
    const blocked = await blockedIds(ctx, viewer._id);
    const others = matches.filter(
      (user) => user._id !== viewer._id && !isHidden(user) && !blocked.has(user._id),
    );
    const cards = await Promise.all(
      others.slice(0, take).map((user) => readerCard(ctx, user, viewer._id)),
    );
    return { items: cards, hasMore: others.length > take };
  },
});

/** How many readers suggestions look at. Plenty for a young network; revisit as it grows. */
const SUGGESTION_POOL = 500;

/**
 * Readers to follow: everyone I don't follow yet, ranked by how many people I follow already
 * follow them (`mutualName` is one of those), then whether they follow me, then popularity.
 */
export const suggestions = query({
  args: { limit: v.number() },
  handler: async (ctx, { limit }) => {
    const viewer = await requireViewer(ctx);
    const myFollows = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) => q.eq("followerId", viewer._id))
      .collect();
    const followingIds = new Set<Id<"users">>(myFollows.map((follow) => follow.followingId));

    // Who the people I follow follow: reader id → names of my follows who follow them.
    const mutuals = new Map<Id<"users">, string[]>();
    for (const followed of myFollows) {
      const person = await ctx.db.get(followed.followingId);
      if (!person) continue;
      const theirs = await ctx.db
        .query("follows")
        .withIndex("by_follower_following", (q) => q.eq("followerId", followed.followingId))
        .collect();
      for (const follow of theirs) {
        mutuals.set(follow.followingId, [...(mutuals.get(follow.followingId) ?? []), person.name]);
      }
    }

    const pool = await ctx.db.query("users").take(SUGGESTION_POOL);
    const blocked = await blockedIds(ctx, viewer._id);
    const candidates = pool.filter(
      (user) =>
        user._id !== viewer._id &&
        !followingIds.has(user._id) &&
        !isHidden(user) &&
        !blocked.has(user._id),
    );
    const ranked = await Promise.all(
      candidates.map(async (user) => ({
        user,
        mutuals: mutuals.get(user._id)?.length ?? 0,
        mutualName: mutuals.get(user._id)?.[0] ?? null,
        followsYou: await isFollowing(ctx, user._id, viewer._id),
      })),
    );
    ranked.sort(
      (a, b) =>
        b.mutuals - a.mutuals ||
        Number(b.followsYou) - Number(a.followsYou) ||
        b.user.followers - a.user.followers ||
        (a.user._id < b.user._id ? 1 : -1),
    );
    const take = listLimit(limit);
    const items = await Promise.all(
      ranked.slice(0, take).map(async ({ user, mutuals, mutualName }) => ({
        ...(await readerCard(ctx, user, viewer._id)),
        mutuals,
        mutualName,
      })),
    );
    return { items, hasMore: ranked.length > take };
  },
});

/** Follow (`follow: true`) or unfollow a reader. Idempotent. Used by the seed too. */
export async function setFollow(
  ctx: MutationCtx,
  viewer: Doc<"users">,
  targetId: Id<"users">,
  follow: boolean,
  now = Date.now(),
) {
  if (targetId === viewer._id) throw appError("INVALID", "Você não pode seguir a si mesmo");
  const target = await ctx.db.get(targetId);
  if (!target) throw notFound("Leitor");
  if (follow && (isHidden(target) || (await isBlockedBetween(ctx, viewer._id, targetId)))) {
    throw appError("FORBIDDEN", "Não é possível seguir esse leitor.");
  }
  const existing = await ctx.db
    .query("follows")
    .withIndex("by_follower_following", (q) =>
      q.eq("followerId", viewer._id).eq("followingId", targetId),
    )
    .unique();

  if (follow && !existing) {
    await ctx.db.insert("follows", { followerId: viewer._id, followingId: targetId });
    await ctx.db.patch(viewer._id, { following: viewer.following + 1 });
    await ctx.db.patch(targetId, { followers: target.followers + 1 });
    await recordActivity(ctx, {
      actorId: viewer._id,
      kind: "followed",
      targetUserId: targetId,
      createdAt: now,
    });
  } else if (!follow && existing) {
    await ctx.db.delete(existing._id);
    await ctx.db.patch(viewer._id, { following: Math.max(0, viewer.following - 1) });
    await ctx.db.patch(targetId, { followers: Math.max(0, target.followers - 1) });
    // An unfollow takes back the "começou a seguir" line from the feeds.
    const lines = await ctx.db
      .query("activities")
      .withIndex("by_actor_target", (q) => q.eq("actorId", viewer._id).eq("targetUserId", targetId))
      .collect();
    for (const line of lines) if (line.kind === "followed") await ctx.db.delete(line._id);
  }
  return { following: follow };
}

export const setFollowing = mutation({
  args: { userId: v.id("users"), follow: v.boolean() },
  handler: async (ctx, { userId, follow }) =>
    setFollow(ctx, await requireViewer(ctx), userId, follow),
});
