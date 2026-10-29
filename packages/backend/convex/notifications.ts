import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, type QueryCtx, query } from "./_generated/server";
import { bookSummary } from "./model/content";
import { listLimit } from "./model/limits";
import { authorOf, isFollowing, requireViewer } from "./model/readers";
import { blockedIds, isHidden } from "./model/safety";

/** Unread rows counted for the badge; past this it shows "99+". */
const UNREAD_CAP = 100;
/** Rows marked read per call (the rest on the next visit). */
const MARK_BATCH = 200;

/** Up to 140 characters of a post or comment, for the notification line. */
const snippet = (text: string) => (text.length > 140 ? `${text.slice(0, 139)}…` : text);

async function view(ctx: QueryCtx, row: Doc<"notifications">, viewer: Doc<"users">) {
  const [actor, post, comment] = await Promise.all([
    ctx.db.get(row.actorId),
    row.postId ? ctx.db.get(row.postId) : null,
    row.commentId ? ctx.db.get(row.commentId) : null,
  ]);
  if (!actor || isHidden(actor)) return null;
  // The post or comment is gone (its notifications go with it, but don't trust a stale row).
  if ((row.postId && !post) || (row.commentId && !comment)) return null;
  const book = post?.bookId ? await ctx.db.get(post.bookId) : null;
  return {
    id: row._id,
    kind: row.kind,
    createdAt: row.createdAt,
    read: row.readAt !== null,
    actor: authorOf(actor),
    /** For "Seguir de volta" on follow notifications. */
    followingActor: row.kind === "follow" ? await isFollowing(ctx, viewer._id, actor._id) : null,
    post: post
      ? {
          id: post._id,
          kind: post.kind,
          snippet: snippet(post.body),
          book: book ? bookSummary(book) : null,
        }
      : null,
    comment: comment ? { id: comment._id, snippet: snippet(comment.body) } : null,
  };
}

/** What others did that concerns me, newest first. Blocked and hidden readers are left out. */
export const list = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const limit = listLimit(args.limit);
    const [rows, blocked] = await Promise.all([
      ctx.db
        .query("notifications")
        .withIndex("by_user_created", (q) => q.eq("userId", viewer._id))
        .order("desc")
        .take(limit + 1),
      blockedIds(ctx, viewer._id),
    ]);
    const views = await Promise.all(
      rows
        .slice(0, limit)
        .filter((row) => !blocked.has(row.actorId))
        .map((row) => view(ctx, row, viewer)),
    );
    return { items: views.filter((item) => item !== null), hasMore: rows.length > limit };
  },
});

/** Unread notifications, for the badge (capped: the badge says "99+"). */
export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", viewer._id).eq("readAt", null))
      .take(UNREAD_CAP);
    return rows.length;
  },
});

/** Opening the notifications marks them all as read. */
export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const now = Date.now();
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", viewer._id).eq("readAt", null))
      .take(MARK_BATCH);
    for (const row of rows) await ctx.db.patch(row._id, { readAt: now });
    return null;
  },
});
