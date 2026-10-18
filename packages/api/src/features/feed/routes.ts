import { cursorQuerySchema } from "@grimo/core";
import { activities, books, follows, posts, user as users } from "@grimo/db";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, inArray, lt, or } from "drizzle-orm";
import { Hono } from "hono";
import type { AppEnv } from "../../env";
import { requireUser } from "../../lib/context";
import { authorColumns, bookColumns, postColumns } from "../posts/queries";

/**
 * Fan-out-on-read feed: my activities + activities of people I follow.
 * Cursor = `createdAt` (ms) of the last item.
 */
export const feedRoutes = new Hono<AppEnv>().get(
  "/",
  zValidator("query", cursorQuerySchema),
  async (c) => {
    const user = requireUser(c);
    const { cursor, limit } = c.req.valid("query");
    const db = c.get("db");

    const following = db
      .select({ id: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, user.id));

    const rows = await db
      .select({
        id: activities.id,
        kind: activities.kind,
        data: activities.data,
        createdAt: activities.createdAt,
        actor: authorColumns,
        book: bookColumns,
        post: postColumns(user.id),
      })
      .from(activities)
      .innerJoin(users, eq(users.id, activities.actorId))
      .leftJoin(books, eq(books.id, activities.bookId))
      .leftJoin(posts, eq(posts.id, activities.postId))
      .where(
        and(
          or(eq(activities.actorId, user.id), inArray(activities.actorId, following)),
          cursor ? lt(activities.createdAt, new Date(Number(cursor))) : undefined,
        ),
      )
      .orderBy(desc(activities.createdAt))
      .limit(limit + 1);

    const items = rows.slice(0, limit);
    const last = items.at(-1);
    const nextCursor = rows.length > limit && last ? String(last.createdAt.getTime()) : null;
    return c.json({ items, nextCursor });
  },
);
