import { editionPages } from "@grimo/core";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { authorOf } from "./readers";
import { blockedIds, isBookVisible, isHidden } from "./safety";

type Ctx = QueryCtx | MutationCtx;

/** The book fields shown next to a post or activity. */
export const bookSummary = (book: Doc<"books">) => ({
  id: book._id,
  openLibraryId: book.openLibraryId,
  title: book.title,
  authors: book.authors,
  coverUrl: book.coverUrl,
});

/** A post as seen by `viewerId` (null when signed out). */
export async function postView(ctx: Ctx, post: Doc<"posts">, viewerId: Id<"users"> | null) {
  const liked = viewerId
    ? await ctx.db
        .query("postLikes")
        .withIndex("by_post_user", (q) => q.eq("postId", post._id).eq("userId", viewerId))
        .unique()
    : null;
  return {
    id: post._id,
    kind: post.kind,
    body: post.body,
    rating: post.rating,
    hasSpoilers: post.hasSpoilers,
    createdAt: post._creationTime,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    likedByMe: liked !== null,
  };
}

/** Joins actor, target reader, book and post into a feed item. Drops orphans. */
export async function activityView(
  ctx: Ctx,
  activity: Doc<"activities">,
  viewerId: Id<"users"> | null,
) {
  const [actor, target, book, post] = await Promise.all([
    ctx.db.get(activity.actorId),
    activity.targetUserId ? ctx.db.get(activity.targetUserId) : null,
    activity.bookId ? ctx.db.get(activity.bookId) : null,
    activity.postId ? ctx.db.get(activity.postId) : null,
  ]);
  if (!actor || isHidden(actor)) return null;
  if (target && isHidden(target)) return null;
  // A hand-added book still in review shows only to whoever added it.
  if (book && !isBookVisible(book, viewerId)) return null;
  if (activity.postId && !post) return null;
  const [reading, postData] = await Promise.all([
    book ? readingOf(ctx, activity, book, viewerId) : null,
    post ? postView(ctx, post, viewerId) : null,
  ]);
  return {
    id: activity._id,
    kind: activity.kind,
    data: activity.data,
    createdAt: activity.createdAt,
    actor: authorOf(actor),
    target: target ? { id: target._id, name: target.name, username: target.username } : null,
    book: book ? bookSummary(book) : null,
    reading,
    post: postData,
  };
}

const entryOf = (ctx: Ctx, userId: Id<"users">, bookId: Id<"books">) =>
  ctx.db
    .query("shelfEntries")
    .withIndex("by_user_book", (q) => q.eq("userId", userId).eq("bookId", bookId))
    .unique();

/**
 * What the feed card shows under the book: the pages of the reader's edition (progress bar),
 * their rating once they finished it, and where the book is on the viewer's own shelves
 * ("Quero ler" button or "Na sua estante").
 */
async function readingOf(
  ctx: Ctx,
  activity: Doc<"activities">,
  book: Doc<"books">,
  viewerId: Id<"users"> | null,
) {
  const [entry, mine] = await Promise.all([
    entryOf(ctx, activity.actorId, book._id),
    viewerId === null
      ? null
      : viewerId === activity.actorId
        ? undefined
        : entryOf(ctx, viewerId, book._id),
  ]);
  const own = mine === undefined ? entry : mine;
  return {
    pages: editionPages(entry?.pageCount, book.pageCount),
    rating: activity.kind === "finished" ? (entry?.rating ?? null) : null,
    viewerStatus: own?.status ?? null,
  };
}

export type ActivityView = NonNullable<Awaited<ReturnType<typeof activityView>>>;

/**
 * The newest `limit` activities of these actors, merged from one index range per actor.
 * `hasMore` tells the client a bigger `limit` would show more.
 */
export async function listActivities(
  ctx: Ctx,
  actorIds: Id<"users">[],
  viewerId: Id<"users"> | null,
  limit: number,
  /** Activities read per actor; the merged list is still `limit` long. Bounds the fan-out. */
  perActorLimit = limit,
) {
  // Nothing from (or about) readers the viewer blocked or was blocked by.
  const blocked = await blockedIds(ctx, viewerId);
  const perActor = await Promise.all(
    actorIds.map((actorId) =>
      ctx.db
        .query("activities")
        .withIndex("by_actor_created", (q) => q.eq("actorId", actorId))
        .order("desc")
        .take(Math.min(limit, perActorLimit) + 1),
    ),
  );
  const newest = perActor
    .flat()
    .filter(
      (activity) =>
        !blocked.has(activity.actorId) &&
        !(activity.targetUserId && blocked.has(activity.targetUserId)),
    )
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit + 1);
  return activityPage(ctx, newest, viewerId, limit);
}

/** Up to `limit + 1` activities (newest first) as a page of feed items. */
export async function activityPage(
  ctx: Ctx,
  newest: Doc<"activities">[],
  viewerId: Id<"users"> | null,
  limit: number,
) {
  const views = await Promise.all(
    newest.slice(0, limit).map((activity) => activityView(ctx, activity, viewerId)),
  );
  return {
    items: views.filter((view): view is ActivityView => view !== null),
    hasMore: newest.length > limit,
  };
}

/** Feed event. `createdAt` defaults to now (the seed backdates it). */
export function recordActivity(
  ctx: MutationCtx,
  activity: {
    actorId: Id<"users">;
    kind: Doc<"activities">["kind"];
    bookId?: Id<"books"> | null;
    postId?: Id<"posts"> | null;
    targetUserId?: Id<"users"> | null;
    data?: Record<string, unknown> | null;
    createdAt?: number;
  },
) {
  return ctx.db.insert("activities", {
    actorId: activity.actorId,
    kind: activity.kind,
    bookId: activity.bookId ?? null,
    postId: activity.postId ?? null,
    targetUserId: activity.targetUserId ?? null,
    data: activity.data ?? null,
    createdAt: activity.createdAt ?? Date.now(),
  });
}
