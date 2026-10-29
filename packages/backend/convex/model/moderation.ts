import type { Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { deleteCommentNotifications, deletePostNotifications } from "./notifications";

/** Deletes a post with its likes, comments, feed lines and notifications. */
export async function deletePost(ctx: MutationCtx, post: Doc<"posts">) {
  const related = await Promise.all([
    ctx.db
      .query("postLikes")
      .withIndex("by_post_user", (q) => q.eq("postId", post._id))
      .collect(),
    ctx.db
      .query("postComments")
      .withIndex("by_post", (q) => q.eq("postId", post._id))
      .collect(),
    ctx.db
      .query("activities")
      .withIndex("by_post", (q) => q.eq("postId", post._id))
      .collect(),
  ]);
  for (const doc of related.flat()) await ctx.db.delete(doc._id);
  await deletePostNotifications(ctx, post._id);
  await ctx.db.delete(post._id);
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
