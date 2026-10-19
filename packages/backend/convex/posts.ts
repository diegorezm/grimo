import { createCommentSchema, createPostSchema } from "@grimo/core";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, query } from "./_generated/server";
import { bookSummary, postView, recordActivity } from "./model/content";
import { notFound, parse } from "./model/errors";
import { authorOf, getViewer, requireViewer } from "./model/readers";
import { postKind } from "./schema";

/** Creates a review or note (and its feed activity). Used by the seed too. */
export async function createPost(
  ctx: MutationCtx,
  authorId: Id<"users">,
  input: {
    kind: "review" | "note";
    bookId: Id<"books"> | null;
    rating: number | null;
    body: string;
    hasSpoilers: boolean;
  },
  now = Date.now(),
) {
  const postId = await ctx.db.insert("posts", {
    authorId,
    ...input,
    likeCount: 0,
    commentCount: 0,
  });
  await recordActivity(ctx, {
    actorId: authorId,
    kind: "posted",
    postId,
    bookId: input.bookId,
    createdAt: now,
  });
  return postId;
}

export async function setLike(
  ctx: MutationCtx,
  userId: Id<"users">,
  postId: Id<"posts">,
  like: boolean,
) {
  const post = await ctx.db.get(postId);
  if (!post) throw notFound("Post");
  const existing = await ctx.db
    .query("postLikes")
    .withIndex("by_post_user", (q) => q.eq("postId", postId).eq("userId", userId))
    .unique();
  if (like && !existing) {
    await ctx.db.insert("postLikes", { postId, userId });
    await ctx.db.patch(postId, { likeCount: post.likeCount + 1 });
  } else if (!like && existing) {
    await ctx.db.delete(existing._id);
    await ctx.db.patch(postId, { likeCount: Math.max(0, post.likeCount - 1) });
  }
  return { liked: like };
}

export async function addComment(
  ctx: MutationCtx,
  authorId: Id<"users">,
  postId: Id<"posts">,
  body: string,
) {
  const post = await ctx.db.get(postId);
  if (!post) throw notFound("Post");
  const id = await ctx.db.insert("postComments", { postId, authorId, body });
  await ctx.db.patch(postId, { commentCount: post.commentCount + 1 });
  return id;
}

export const create = mutation({
  args: {
    kind: postKind,
    bookId: v.optional(v.union(v.id("books"), v.null())),
    rating: v.optional(v.union(v.number(), v.null())),
    body: v.string(),
    hasSpoilers: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const input = parse(createPostSchema, args);
    const postId = await createPost(ctx, viewer._id, {
      ...input,
      bookId: input.bookId as Id<"books"> | null,
    });
    return { post: { id: postId } };
  },
});

/** A post with its author, book and comments (oldest first). Public. */
export const get = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("posts", args.id);
    const post = id ? await ctx.db.get(id) : null;
    if (!post) throw notFound("Post");
    const viewer = await getViewer(ctx);
    const [author, book, view, comments] = await Promise.all([
      ctx.db.get(post.authorId),
      post.bookId ? ctx.db.get(post.bookId) : null,
      postView(ctx, post, viewer?._id ?? null),
      ctx.db
        .query("postComments")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect(),
    ]);
    if (!author) throw notFound("Post");
    const commentViews = await Promise.all(
      comments.map(async (comment) => {
        const commenter = await ctx.db.get(comment.authorId);
        return commenter
          ? {
              id: comment._id,
              body: comment.body,
              createdAt: comment._creationTime,
              author: authorOf(commenter),
            }
          : null;
      }),
    );
    return {
      post: { ...view, author: authorOf(author), book: book ? bookSummary(book) : null },
      comments: commentViews.filter((comment) => comment !== null),
    };
  },
});

export const remove = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, { id }) => {
    const viewer = await requireViewer(ctx);
    const post = await ctx.db.get(id);
    if (!post || post.authorId !== viewer._id) return null;
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

/** Like (`like: true`) or unlike a post. Idempotent. */
export const setLiked = mutation({
  args: { postId: v.id("posts"), like: v.boolean() },
  handler: async (ctx, { postId, like }) => {
    const viewer = await requireViewer(ctx);
    return setLike(ctx, viewer._id, postId, like);
  },
});

export const comment = mutation({
  args: { postId: v.id("posts"), body: v.string() },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const { body } = parse(createCommentSchema, args);
    return { comment: { id: await addComment(ctx, viewer._id, args.postId, body) } };
  },
});
