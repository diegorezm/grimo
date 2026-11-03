import { editionPages } from "@grimo/core";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { notifyMentions } from "./notifications";
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

/** Comments read per post to take hidden and blocked commenters out of its count. */
const COUNTED_COMMENTS = 100;

/**
 * The post's comment count without the comments the thread hides from the viewer (`posts.get`):
 * by hidden readers, or across a block. Past the first `COUNTED_COMMENTS`, all count.
 */
async function visibleCommentCount(ctx: Ctx, post: Doc<"posts">, blocked: Set<Id<"users">>) {
  if (post.commentCount === 0) return 0;
  const comments = await ctx.db
    .query("postComments")
    .withIndex("by_post", (q) => q.eq("postId", post._id))
    .take(COUNTED_COMMENTS);
  const authors = await Promise.all(
    comments.map((comment) =>
      blocked.has(comment.authorId) ? null : ctx.db.get(comment.authorId),
    ),
  );
  const hidden = authors.filter((author) => !author || isHidden(author)).length;
  return Math.max(0, post.commentCount - hidden);
}

/**
 * A post as seen by `viewerId` (null when signed out); `blocked` is `blockedIds(viewerId)`, read
 * once by the caller.
 */
export async function postView(
  ctx: Ctx,
  post: Doc<"posts">,
  viewerId: Id<"users"> | null,
  blocked: Set<Id<"users">>,
) {
  const [liked, commentCount] = await Promise.all([
    viewerId
      ? ctx.db
          .query("postLikes")
          .withIndex("by_post_user", (q) => q.eq("postId", post._id).eq("userId", viewerId))
          .unique()
      : null,
    visibleCommentCount(ctx, post, blocked),
  ]);
  return {
    id: post._id,
    kind: post.kind,
    body: post.body,
    rating: post.rating,
    hasSpoilers: post.hasSpoilers,
    page: post.page ?? null,
    createdAt: post._creationTime,
    likeCount: post.likeCount,
    commentCount,
    likedByMe: liked !== null,
  };
}

/** Joins actor, target reader, book and post into a feed item. Drops orphans. */
export async function activityView(
  ctx: Ctx,
  activity: Doc<"activities">,
  viewerId: Id<"users"> | null,
  blocked: Set<Id<"users">>,
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
    post ? postView(ctx, post, viewerId, blocked) : null,
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
  return activityPage(ctx, newest, viewerId, blocked, limit);
}

/** Up to `limit + 1` activities (newest first) as a page of feed items. */
export async function activityPage(
  ctx: Ctx,
  newest: Doc<"activities">[],
  viewerId: Id<"users"> | null,
  blocked: Set<Id<"users">>,
  limit: number,
) {
  const views = await Promise.all(
    newest.slice(0, limit).map((activity) => activityView(ctx, activity, viewerId, blocked)),
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

/** Activities about a book on a shelf: the ones readers like and comment on as "updates". */
const UPDATE_KINDS = new Set<Doc<"activities">["kind"]>(["shelved", "progress", "finished"]);

/**
 * The post holding a feed update's note, likes and comments (`kind: "update"`, by whoever did
 * it). Made the first time someone reacts, or with the note written when marking the page.
 * A "posted" activity already has its post.
 */
export async function updatePostFor(
  ctx: MutationCtx,
  activity: Doc<"activities">,
  note?: { body: string; hasSpoilers: boolean },
) {
  if (activity.postId) return activity.postId;
  if (!UPDATE_KINDS.has(activity.kind)) return null;
  const postId = await ctx.db.insert("posts", {
    authorId: activity.actorId,
    bookId: activity.bookId,
    kind: "update",
    rating: null,
    body: note?.body ?? "",
    hasSpoilers: note?.hasSpoilers ?? false,
    likeCount: 0,
    commentCount: 0,
  });
  await ctx.db.patch(activity._id, { postId });
  if (note) {
    await notifyMentions(
      ctx,
      { actorId: activity.actorId, text: note.body, postId },
      activity.createdAt,
    );
  }
  return postId;
}
