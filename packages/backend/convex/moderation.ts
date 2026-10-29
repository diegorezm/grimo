import { type ReportTarget, reportSchema } from "@grimo/core";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import {
  internalMutation,
  type MutationCtx,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server";
import { appError, notFound, parse } from "./model/errors";
import { deleteComment, deletePost, reviewBook as reviewBookIn } from "./model/moderation";
import { deleteNotificationsBetween } from "./model/notifications";
import { enforceRateLimit } from "./model/rateLimit";
import { authorOf, requireAdmin, requireViewer, userByUsername } from "./model/readers";
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
  if (target === "message") {
    const id = ctx.db.normalizeId("groupMessages", targetId);
    const message = id ? await ctx.db.get(id) : null;
    if (!message) throw notFound("Mensagem");
    return { userId: message.authorId, snapshot: message.body };
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
    await enforceRateLimit(ctx, "report", viewer._id);
    const content = await reportedContent(ctx, input.target, input.targetId);
    if (content.userId === viewer._id) {
      throw appError("INVALID", "Você não pode denunciar algo seu.");
    }
    const existing = await ctx.db
      .query("reports")
      .withIndex("by_reporter_target", (q) =>
        q.eq("reporterId", viewer._id).eq("target", input.target).eq("targetId", input.targetId),
      )
      .order("desc")
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
      await deleteNotificationsBetween(ctx, viewer._id, userId);
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

/** Reports and books shown at once in the panel. */
const QUEUE_SIZE = 50;

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

/** Removes a reported post, comment or Juntos message (counters, feed and notifications too). */
export const removeContent = internalMutation({
  args: { target: reportTarget, targetId: v.string() },
  handler: async (ctx, { target, targetId }) => {
    await removeReported(ctx, target, targetId);
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

/**
 * Approves (public: in everyone's search) or rejects (stays only on the shelf of whoever added
 * it) a hand-added book. The panel uses `decideBook`; this is for the dashboard and the CLI.
 */
export const reviewBook = internalMutation({
  args: { openLibraryId: v.string(), approve: v.boolean() },
  handler: async (ctx, { openLibraryId, approve }) => {
    await decide(ctx, openLibraryId, approve);
    return null;
  },
});

/** Gives (or takes back) access to the moderation panel: `npx convex run moderation:setAdmin`. */
export const setAdmin = internalMutation({
  args: { username: v.string(), admin: v.boolean() },
  handler: async (ctx, { username, admin }) => {
    const user = await userByUsername(ctx, username.toLowerCase());
    if (!user) throw notFound("Leitor");
    await ctx.db.patch(user._id, { role: admin ? "admin" : undefined });
    return null;
  },
});

async function decide(ctx: MutationCtx, openLibraryId: string, approve: boolean) {
  const book = await ctx.db
    .query("books")
    .withIndex("by_openLibraryId", (q) => q.eq("openLibraryId", openLibraryId))
    .unique();
  if (!book?.reviewStatus) throw notFound("Livro cadastrado");
  await reviewBookIn(ctx, book, approve);
}

/** Deletes what a report points at (a reader can't be deleted: they get suspended instead). */
async function removeReported(ctx: MutationCtx, target: ReportTarget, targetId: string) {
  if (target === "post") {
    const id = ctx.db.normalizeId("posts", targetId);
    const post = id ? await ctx.db.get(id) : null;
    if (post) await deletePost(ctx, post);
  } else if (target === "comment") {
    const id = ctx.db.normalizeId("postComments", targetId);
    const comment = id ? await ctx.db.get(id) : null;
    if (comment) await deleteComment(ctx, comment);
  } else if (target === "message") {
    const id = ctx.db.normalizeId("groupMessages", targetId);
    if (id && (await ctx.db.get(id))) await ctx.db.delete(id);
  }
}

// The moderation panel (`/admin` on the web): open reports and hand-added books to review.

/** Open reports (oldest first, so nothing waits forever) and books waiting for review. */
export const queue = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [reports, books] = await Promise.all([
      ctx.db
        .query("reports")
        .withIndex("by_status_created", (q) => q.eq("status", "open"))
        .take(QUEUE_SIZE),
      ctx.db
        .query("books")
        .withIndex("by_reviewStatus", (q) => q.eq("reviewStatus", "pending"))
        .take(QUEUE_SIZE),
    ]);
    return {
      reports: await Promise.all(reports.map((report) => reportView(ctx, report))),
      books: await Promise.all(
        books.map(async (book) => {
          const author = book.createdBy ? await ctx.db.get(book.createdBy) : null;
          return {
            openLibraryId: book.openLibraryId,
            title: book.title,
            authors: book.authors,
            pageCount: book.pageCount,
            publishedYear: book.publishedYear,
            addedAt: book._creationTime,
            addedBy: author ? authorOf(author) : null,
          };
        }),
      ),
    };
  },
});

async function reportView(ctx: QueryCtx, report: Doc<"reports">) {
  const [reporter, targetUser, location] = await Promise.all([
    report.reporterId ? ctx.db.get(report.reporterId) : null,
    report.targetUserId ? ctx.db.get(report.targetUserId) : null,
    reportLocation(ctx, report),
  ]);
  return {
    id: report._id,
    target: report.target,
    targetId: report.targetId,
    reason: report.reason,
    details: report.details,
    snapshot: report.snapshot,
    createdAt: report.createdAt,
    reporter: reporter ? authorOf(reporter) : null,
    targetUser: targetUser
      ? { ...authorOf(targetUser), suspended: Boolean(targetUser.suspendedAt) }
      : null,
    /** Where to see it; null when the content is already gone. */
    location,
  };
}

/** The post a reported post/comment is on, or the group of a message; null when it's gone. */
async function reportLocation(ctx: QueryCtx, report: Doc<"reports">) {
  if (report.target === "post") {
    const id = ctx.db.normalizeId("posts", report.targetId);
    return id && (await ctx.db.get(id)) ? { postId: id, groupId: null } : null;
  }
  if (report.target === "comment") {
    const id = ctx.db.normalizeId("postComments", report.targetId);
    const comment = id ? await ctx.db.get(id) : null;
    return comment ? { postId: comment.postId, groupId: null } : null;
  }
  if (report.target === "message") {
    const id = ctx.db.normalizeId("groupMessages", report.targetId);
    const message = id ? await ctx.db.get(id) : null;
    return message ? { postId: null, groupId: message.groupId } : null;
  }
  return { postId: null, groupId: null };
}

/**
 * Decides a report: dismiss it, remove the content, or suspend its author (who disappears from
 * the app). Other open reports about the same thing are closed with it.
 */
export const act = mutation({
  args: {
    reportId: v.id("reports"),
    action: v.union(v.literal("dismiss"), v.literal("remove"), v.literal("suspend")),
  },
  handler: async (ctx, { reportId, action }) => {
    await requireAdmin(ctx);
    const report = await ctx.db.get(reportId);
    if (!report) throw notFound("Denúncia");
    if (action === "remove") await removeReported(ctx, report.target, report.targetId);
    if (action === "suspend" && report.targetUserId) {
      await ctx.db.patch(report.targetUserId, { suspendedAt: Date.now() });
    }
    const status = action === "dismiss" ? "dismissed" : "actioned";
    const now = Date.now();
    const open = await ctx.db
      .query("reports")
      .withIndex("by_status_created", (q) => q.eq("status", "open"))
      .take(500);
    for (const other of open) {
      if (other.target === report.target && other.targetId === report.targetId) {
        await ctx.db.patch(other._id, { status, resolvedAt: now });
      }
    }
    return null;
  },
});

/** Approve or reject a hand-added book from the panel. */
export const decideBook = mutation({
  args: { openLibraryId: v.string(), approve: v.boolean() },
  handler: async (ctx, { openLibraryId, approve }) => {
    await requireAdmin(ctx);
    await decide(ctx, openLibraryId, approve);
    return null;
  },
});
