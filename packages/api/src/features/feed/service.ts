import { toPage } from "@grimo/core";
import { activities, books, type Database, posts, user as users } from "@grimo/db";
import { and, desc, eq, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { before, readCursor } from "../../lib/pagination";
import { authorColumns, bookColumns, postColumns } from "../posts/queries";

/** The reader a "followed" activity points at. */
const targets = alias(users, "target");

/**
 * A page of activities matching `where`, newest first, as seen by `viewerId` (null when signed
 * out). Keyset on (`createdAt`, `id`).
 */
export async function listActivities(
  db: Database,
  {
    viewerId,
    where,
    cursor,
    limit,
  }: { viewerId: string | null; where: SQL | undefined; cursor?: string; limit: number },
) {
  const rows = await db
    .select({
      id: activities.id,
      kind: activities.kind,
      data: activities.data,
      createdAt: activities.createdAt,
      actor: authorColumns,
      target: { id: targets.id, name: targets.name, username: targets.username },
      book: bookColumns,
      post: postColumns(viewerId),
    })
    .from(activities)
    .innerJoin(users, eq(users.id, activities.actorId))
    .leftJoin(targets, eq(targets.id, activities.targetUserId))
    .leftJoin(books, eq(books.id, activities.bookId))
    .leftJoin(posts, eq(posts.id, activities.postId))
    .where(and(where, before([activities.createdAt, activities.id], readCursor(cursor, 2))))
    .orderBy(desc(activities.createdAt), desc(activities.id))
    .limit(limit + 1);
  return toPage(rows, limit, (item) => [item.createdAt.getTime(), item.id]);
}
