import { reportSchema } from "@grimo/core";
import { v } from "convex/values";
import { internalMutation, type MutationCtx, mutation, query } from "./_generated/server";
import { appError, notFound, parse } from "./model/errors";
import { authorOf, requireViewer } from "./model/readers";
import { MAX_BLOCKS } from "./model/safety";
import { reportReason, reportTarget } from "./schema";
import { setFollow } from "./users";

/** Who answers for the reported thing, and a copy of its text (kept if it gets deleted). */
async function reportedContent(ctx: MutationCtx, target: string, targetId: string) {
  if (target === "post") {
    const id = ctx.db.normalizeId("posts", targetId);
    const post = id ? await ctx.db.get(id) : null;
    if (!post) throw notFound("Post");
    return { userId: post.authorId, snapshot: post.body };
  }
  if (target === "comment") {
    const id = ctx.db.normalizeId("postComments", targetId);
    const comment = id ? await ctx.db.get(id) : null;
    if (!comment) throw notFound("Comentário");
    return { userId: comment.authorId, snapshot: comment.body };
  }
  const id = ctx.db.normalizeId("users", targetId);
  const user = id ? await ctx.db.get(id) : null;
  if (!user) throw notFound("Leitor");
  return { userId: user._id, snapshot: `${user.name} (@${user.username}): ${user.bio ?? ""}` };
}

/**
 * Reports a post, comment or reader to moderation. Reporting the same thing twice keeps one
 * report. The queue is reviewed in the Convex dashboard (`reports`, status "open").
 */
export const report = mutation({
  args: {
    target: reportTarget,
    targetId: v.string(),
    reason: reportReason,
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const input = parse(reportSchema, args);
    const content = await reportedContent(ctx, input.target, input.targetId);
    if (content.userId === viewer._id) {
      throw appError("INVALID", "Você não pode denunciar algo seu.");
    }
    const existing = await ctx.db
      .query("reports")
      .withIndex("by_reporter_target", (q) =>
        q.eq("reporterId", viewer._id).eq("target", input.target).eq("targetId", input.targetId),
      )
      .first();
    if (existing?.status === "open") return null;
    await ctx.db.insert("reports", {
      reporterId: viewer._id,
      target: input.target,
      targetId: input.targetId,
      targetUserId: content.userId,
      reason: input.reason,
      details: input.details || null,
      snapshot: content.snapshot.slice(0, 5000),
      status: "open",
      createdAt: Date.now(),
      resolvedAt: null,
    });
    return null;
  },
});

/**
 * Blocks (`block: true`) or unblocks a reader. Blocking undoes follows both ways; while it lasts
 * neither can follow, like or comment on the other, and each other's content is hidden.
 */
export const setBlocked = mutation({
  args: { userId: v.id("users"), block: v.boolean() },
  handler: async (ctx, { userId, block }) => {
    const viewer = await requireViewer(ctx);
    if (userId === viewer._id) throw appError("INVALID", "Você não pode bloquear a si mesmo.");
    const target = await ctx.db.get(userId);
    if (!target) throw notFound("Leitor");
    const existing = await ctx.db
      .query("blocks")
      .withIndex("by_blocker_blocked", (q) => q.eq("blockerId", viewer._id).eq("blockedId", userId))
      .unique();
    if (block && !existing) {
      const count = await ctx.db
        .query("blocks")
        .withIndex("by_blocker_blocked", (q) => q.eq("blockerId", viewer._id))
        .take(MAX_BLOCKS);
      if (count.length >= MAX_BLOCKS) throw appError("INVALID", "Limite de bloqueios atingido.");
      await setFollow(ctx, viewer, userId, false);
      await setFollow(ctx, target, viewer._id, false);
      await ctx.db.insert("blocks", { blockerId: viewer._id, blockedId: userId });
    } else if (!block && existing) {
      await ctx.db.delete(existing._id);
    }
    return { blocked: block };
  },
});

/** Readers I blocked (settings, to unblock), newest first. */
export const blocked = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const rows = await ctx.db
      .query("blocks")
      .withIndex("by_blocker_blocked", (q) => q.eq("blockerId", viewer._id))
      .take(MAX_BLOCKS);
    const readers = await Promise.all(rows.map((row) => ctx.db.get(row.blockedId)));
    return {
      items: readers.flatMap((reader) => (reader && !reader.deletedAt ? [authorOf(reader)] : [])),
    };
  },
});

// Moderation tools, run from the Convex dashboard (Functions → moderation) or the CLI:
//   npx convex run moderation:resolve '{"reportId":"…","status":"actioned"}'

/** Closes a report: `actioned` (something was done) or `dismissed`. */
export const resolve = internalMutation({
  args: {
    reportId: v.id("reports"),
    status: v.union(v.literal("actioned"), v.literal("dismissed")),
  },
  handler: async (ctx, { reportId, status }) => {
    await ctx.db.patch(reportId, { status, resolvedAt: Date.now() });
    return null;
  },
});

/** Removes a reported post or comment (counters and feed lines included). */
export const removeContent = internalMutation({
  args: { target: v.union(v.literal("post"), v.literal("comment")), targetId: v.string() },
  handler: async (ctx, { target, targetId }) => {
    if (target === "comment") {
      const id = ctx.db.normalizeId("postComments", targetId);
      const comment = id ? await ctx.db.get(id) : null;
      if (!comment) return null;
      const post = await ctx.db.get(comment.postId);
      if (post) await ctx.db.patch(post._id, { commentCount: Math.max(0, post.commentCount - 1) });
      await ctx.db.delete(comment._id);
      return null;
    }
    const id = ctx.db.normalizeId("posts", targetId);
    if (!id || !(await ctx.db.get(id))) return null;
    const related = await Promise.all([
      ctx.db
        .query("postLikes")
        .withIndex("by_post_user", (q) => q.eq("postId", id))
        .collect(),
      ctx.db
        .query("postComments")
        .withIndex("by_post", (q) => q.eq("postId", id))
        .collect(),
      ctx.db
        .query("activities")
        .withIndex("by_post", (q) => q.eq("postId", id))
        .collect(),
    ]);
    for (const doc of related.flat()) await ctx.db.delete(doc._id);
    await ctx.db.delete(id);
    return null;
  },
});

/** Suspends (or, with `suspend: false`, restores) a reader: hidden and unable to use the app. */
export const suspend = internalMutation({
  args: { username: v.string(), suspend: v.boolean() },
  handler: async (ctx, { username, suspend }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username.toLowerCase()))
      .unique();
    if (!user) throw notFound("Leitor");
    await ctx.db.patch(user._id, { suspendedAt: suspend ? Date.now() : undefined });
    return null;
  },
});
