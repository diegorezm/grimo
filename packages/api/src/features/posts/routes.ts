import { createCommentSchema, createPostSchema } from "@grimo/core";
import { activities, books, postComments, postLikes, posts, user as users } from "@grimo/db";
import { zValidator } from "@hono/zod-validator";
import { and, asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import type { AppEnv } from "../../env";
import { requireUser } from "../../lib/context";
import { notFound } from "../../lib/errors";
import { authorColumns, bookColumns, joinAuthor, joinBook, postColumns } from "./queries";

export const postsRoutes = new Hono<AppEnv>()
  .post("/", zValidator("json", createPostSchema), async (c) => {
    const user = requireUser(c);
    const db = c.get("db");
    const input = c.req.valid("json");
    const [post] = await db
      .insert(posts)
      .values({ ...input, authorId: user.id })
      .returning();
    await db
      .insert(activities)
      .values({ actorId: user.id, kind: "posted", postId: post!.id, bookId: post!.bookId });
    return c.json({ post: post! }, 201);
  })
  .get("/:id", async (c) => {
    const db = c.get("db");
    const id = c.req.param("id");
    const post = await db
      .select({
        ...postColumns(c.get("user")?.id ?? null),
        author: authorColumns,
        book: bookColumns,
      })
      .from(posts)
      .innerJoin(users, joinAuthor)
      .leftJoin(books, joinBook)
      .where(eq(posts.id, id))
      .get();
    if (!post) throw notFound("Post");

    const comments = await db
      .select({
        id: postComments.id,
        body: postComments.body,
        createdAt: postComments.createdAt,
        author: authorColumns,
      })
      .from(postComments)
      .innerJoin(users, eq(users.id, postComments.authorId))
      .where(eq(postComments.postId, id))
      .orderBy(asc(postComments.createdAt));
    return c.json({ post, comments });
  })
  .delete("/:id", async (c) => {
    const user = requireUser(c);
    await c
      .get("db")
      .delete(posts)
      .where(and(eq(posts.id, c.req.param("id")), eq(posts.authorId, user.id)));
    return c.body(null, 204);
  })
  .post("/:id/like", async (c) => {
    const user = requireUser(c);
    await c
      .get("db")
      .insert(postLikes)
      .values({ postId: c.req.param("id"), userId: user.id })
      .onConflictDoNothing();
    return c.json({ liked: true });
  })
  .delete("/:id/like", async (c) => {
    const user = requireUser(c);
    await c
      .get("db")
      .delete(postLikes)
      .where(and(eq(postLikes.postId, c.req.param("id")), eq(postLikes.userId, user.id)));
    return c.json({ liked: false });
  })
  .post("/:id/comments", zValidator("json", createCommentSchema), async (c) => {
    const user = requireUser(c);
    const [comment] = await c
      .get("db")
      .insert(postComments)
      .values({ postId: c.req.param("id"), authorId: user.id, body: c.req.valid("json").body })
      .returning();
    return c.json({ comment: comment! }, 201);
  });
