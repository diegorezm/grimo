import { extractMentions, type NotificationKind } from "@grimo/core";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { userByUsername } from "./readers";
import { isBlockedBetween, isHidden } from "./safety";

type Target = {
  userId: Id<"users">;
  actorId: Id<"users">;
  kind: NotificationKind;
  postId?: Id<"posts"> | null;
  commentId?: Id<"postComments"> | null;
};

/** `actorId`'s notifications of `kind` to `userId` about `postId` (null: none, e.g. follows). */
async function existing(ctx: MutationCtx, target: Target) {
  const rows = await ctx.db
    .query("notifications")
    .withIndex("by_actor_post", (q) =>
      q.eq("actorId", target.actorId).eq("postId", target.postId ?? null),
    )
    .take(100);
  return rows.filter((row) => row.kind === target.kind && row.userId === target.userId);
}

/**
 * Tells `userId` what `actorId` did. Nothing for yourself, for hidden readers or across a
 * block; a like or follow that comes back after being undone doesn't notify twice.
 */
export async function notify(ctx: MutationCtx, target: Target, now = Date.now()) {
  if (target.userId === target.actorId) return;
  const user = await ctx.db.get(target.userId);
  if (!user || isHidden(user)) return;
  if (await isBlockedBetween(ctx, target.userId, target.actorId)) return;
  if (target.kind === "like" || target.kind === "follow") {
    if ((await existing(ctx, target)).length > 0) return;
  }
  await ctx.db.insert("notifications", {
    userId: target.userId,
    actorId: target.actorId,
    kind: target.kind,
    postId: target.postId ?? null,
    commentId: target.commentId ?? null,
    createdAt: now,
    readAt: null,
  });
}

/** Takes a like or follow notification back when it is undone. */
export async function unnotify(ctx: MutationCtx, target: Target) {
  for (const row of await existing(ctx, target)) await ctx.db.delete(row._id);
}

/**
 * Notifies the readers @mentioned in `text`, except `skip` (e.g. the post's author, who already
 * gets "comentou"). Unknown names are ignored.
 */
export async function notifyMentions(
  ctx: MutationCtx,
  input: {
    actorId: Id<"users">;
    text: string;
    postId: Id<"posts">;
    commentId?: Id<"postComments"> | null;
    skip?: Id<"users">[];
  },
  now = Date.now(),
) {
  for (const username of extractMentions(input.text)) {
    const user = await userByUsername(ctx, username);
    if (!user || input.skip?.includes(user._id)) continue;
    await notify(
      ctx,
      {
        userId: user._id,
        actorId: input.actorId,
        kind: "mention",
        postId: input.postId,
        commentId: input.commentId ?? null,
      },
      now,
    );
  }
}

/** Notifications pointing at a post (all kinds), for when the post is deleted. */
export async function deletePostNotifications(ctx: MutationCtx, postId: Id<"posts">) {
  const rows = await ctx.db
    .query("notifications")
    .withIndex("by_post", (q) => q.eq("postId", postId))
    .collect();
  for (const row of rows) await ctx.db.delete(row._id);
}

/** Notifications pointing at a comment ("comentou", mentions in it), for when it is deleted. */
export async function deleteCommentNotifications(ctx: MutationCtx, commentId: Id<"postComments">) {
  const rows = await ctx.db
    .query("notifications")
    .withIndex("by_comment", (q) => q.eq("commentId", commentId))
    .collect();
  for (const row of rows) await ctx.db.delete(row._id);
}

/** After a block: what each of the two was told about the other goes away. */
export async function deleteNotificationsBetween(ctx: MutationCtx, a: Id<"users">, b: Id<"users">) {
  for (const [actorId, userId] of [
    [a, b],
    [b, a],
  ] as const) {
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_actor_post", (q) => q.eq("actorId", actorId))
      .take(1000);
    for (const row of rows) if (row.userId === userId) await ctx.db.delete(row._id);
  }
}
