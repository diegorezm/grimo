import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { deleteCommentNotifications } from "./notifications";

/** Rows removed per run when a post's likes, comments and notifications are erased. */
const POST_CHILDREN_BATCH = 200;

/**
 * Deletes a post and its feed lines now; its likes, comments and notifications go in batches
 * (`posts.purgeChildren`), so a viral post doesn't exceed one transaction's limits.
 */
export async function deletePost(ctx: MutationCtx, post: Doc<"posts">) {
  const activities = await ctx.db
    .query("activities")
    .withIndex("by_post", (q) => q.eq("postId", post._id))
    .take(20);
  // A review or note goes with its feed entry; an update's entry stays, without the post.
  for (const activity of activities) {
    if (post.kind === "update") await ctx.db.patch(activity._id, { postId: null });
    else await ctx.db.delete(activity._id);
  }
  await ctx.db.delete(post._id);
  await ctx.scheduler.runAfter(0, internal.posts.purgeChildren, { postId: post._id });
}

/** One batch of a deleted post's likes, comments and notifications; true if more remain. */
export async function deletePostChildren(ctx: MutationCtx, postId: Id<"posts">) {
  const [likes, comments, notifications] = await Promise.all([
    ctx.db
      .query("postLikes")
      .withIndex("by_post_user", (q) => q.eq("postId", postId))
      .take(POST_CHILDREN_BATCH),
    ctx.db
      .query("postComments")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .take(POST_CHILDREN_BATCH),
    ctx.db
      .query("notifications")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .take(POST_CHILDREN_BATCH),
  ]);
  for (const doc of [...likes, ...comments, ...notifications]) await ctx.db.delete(doc._id);
  return [likes, comments, notifications].some((rows) => rows.length === POST_CHILDREN_BATCH);
}

/** Deletes a comment and its notifications, and fixes the post's count. */
export async function deleteComment(ctx: MutationCtx, comment: Doc<"postComments">) {
  await ctx.db.delete(comment._id);
  await deleteCommentNotifications(ctx, comment._id);
  const post = await ctx.db.get(comment.postId);
  if (post) await ctx.db.patch(post._id, { commentCount: Math.max(0, post.commentCount - 1) });
}

/** Approves or rejects a hand-added book (`books.addManual`). */
export async function reviewBook(ctx: MutationCtx, book: Doc<"books">, approve: boolean) {
  await ctx.db.patch(book._id, { reviewStatus: approve ? "approved" : "rejected" });
}

export type LogAction = Doc<"moderationLog">["action"];

/** Appends to the moderation history (`actor` null: the CLI). */
export async function logAction(
  ctx: MutationCtx,
  actor: Doc<"users"> | null,
  action: LogAction,
  extra: { targetUserId?: Doc<"users">["_id"] | null; targetId?: string; details?: string } = {},
) {
  await ctx.db.insert("moderationLog", {
    actorId: actor?._id ?? null,
    action,
    targetUserId: extra.targetUserId ?? null,
    targetId: extra.targetId ?? null,
    details: extra.details ?? null,
    createdAt: Date.now(),
  });
}
