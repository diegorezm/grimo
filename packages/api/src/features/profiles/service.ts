import { toPage } from "@grimo/core";
import {
  books,
  type Database,
  follows,
  profiles,
  readingGoals,
  shelfEntries,
  user as users,
} from "@grimo/db";
import { and, desc, eq, inArray, isNotNull, ne, notExists, type SQL, sql } from "drizzle-orm";
import { after, before, readCursor } from "../../lib/pagination";

/** Public profile: auth user + reader profile + current-year goal + follow counts. */
export async function getProfile(db: Database, userId: string) {
  const year = new Date().getUTCFullYear();
  const row = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      image: users.image,
      bio: profiles.bio,
      favoriteGenres: profiles.favoriteGenres,
      yearlyGoal: readingGoals.target,
      followers: sql<number>`(select count(*) from ${follows} where ${follows.followingId} = ${users.id})`,
      following: sql<number>`(select count(*) from ${follows} where ${follows.followerId} = ${users.id})`,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .leftJoin(readingGoals, and(eq(readingGoals.userId, users.id), eq(readingGoals.year, year)))
    .where(eq(users.id, userId))
    .get();

  if (!row) return null;
  return { ...row, favoriteGenres: row.favoriteGenres ?? [] };
}

/** Does `followerId` follow `followingId`? Raw SQL so it works inside any select. */
const followExists = (followerId: SQL | string, followingId: SQL | string) =>
  sql<boolean>`exists(select 1 from ${follows} f where f.follower_id = ${followerId} and f.following_id = ${followingId})`.mapWith(
    Boolean,
  );

/**
 * A reader in a list (search, suggestions, followers…), from the viewer's point of view, with a
 * peek at their shelf: book count, the three latest covers and what they are reading now.
 * Computed fields are aliased so they also work from a subquery (see `suggestReaders`).
 */
export function readerCardColumns(viewerId: string | null) {
  const viewer = viewerId ?? "";
  return {
    id: users.id,
    name: users.name,
    username: users.username,
    image: users.image,
    bio: profiles.bio,
    followers: sql<number>`(select count(*) from ${follows} f where f.following_id = ${users.id})`
      .mapWith(Number)
      .as("followers"),
    bookCount: sql<number>`(select count(*) from ${shelfEntries} se where se.user_id = ${users.id})`
      .mapWith(Number)
      .as("book_count"),
    covers: sql<
      string[]
    >`(select json_group_array(cover_url) from (select b.cover_url from ${shelfEntries} se join ${books} b on b.id = se.book_id where se.user_id = ${users.id} and b.cover_url is not null order by se.updated_at desc limit 3))`
      .mapWith((value: string) => JSON.parse(value) as string[])
      .as("covers"),
    readingNow: sql<
      string | null
    >`(select b.title from ${shelfEntries} se join ${books} b on b.id = se.book_id where se.user_id = ${users.id} and se.status = 'reading' order by se.updated_at desc limit 1)`.as(
      "reading_now",
    ),
    isFollowing: followExists(viewer, sql`${users.id}`).as("is_following"),
    followsYou: followExists(sql`${users.id}`, viewer).as("follows_you"),
  };
}

/** `LIKE` pattern for "contains `q`", with the wildcards in `q` escaped (`escape '!'`). */
const containsPattern = (q: string) => `%${q.toLowerCase().replace(/[!%_]/g, (c) => `!${c}`)}%`;

/** Readers whose name or username contains `q`, by username. Keyset on `username`. */
export async function searchReaders(
  db: Database,
  { viewerId, q, cursor, limit }: { viewerId: string; q: string; cursor?: string; limit: number },
) {
  const pattern = containsPattern(q);
  const rows = await db
    .select(readerCardColumns(viewerId))
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(
      and(
        isNotNull(users.username),
        ne(users.id, viewerId),
        sql`(lower(${users.name}) like ${pattern} escape '!' or ${users.username} like ${pattern} escape '!')`,
        after([users.username], readCursor(cursor, 1)),
      ),
    )
    .orderBy(users.username)
    .limit(limit + 1);
  return toPage(rows, limit, (reader) => [reader.username ?? ""]);
}

/**
 * Readers to follow: everyone I don't follow yet, ranked by how many people I follow already
 * follow them (`mutualName` is one of those), then whether they follow me, then popularity.
 * The ranking is a subquery so the keyset can use its computed columns.
 */
export async function suggestReaders(
  db: Database,
  { viewerId, cursor, limit }: { viewerId: string; cursor?: string; limit: number },
) {
  const ranked = db
    .select({
      ...readerCardColumns(viewerId),
      mutuals:
        sql<number>`(select count(*) from ${follows} mine join ${follows} theirs on theirs.follower_id = mine.following_id where mine.follower_id = ${viewerId} and theirs.following_id = ${users.id})`
          .mapWith(Number)
          .as("mutuals"),
      mutualName: sql<
        string | null
      >`(select u.name from ${follows} mine join ${follows} theirs on theirs.follower_id = mine.following_id join ${users} u on u.id = mine.following_id where mine.follower_id = ${viewerId} and theirs.following_id = ${users.id} limit 1)`.as(
        "mutual_name",
      ),
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(
      and(
        isNotNull(users.username),
        ne(users.id, viewerId),
        notExists(
          db
            .select({ one: sql`1` })
            .from(follows)
            .where(and(eq(follows.followerId, viewerId), eq(follows.followingId, users.id))),
        ),
      ),
    )
    .as("ranked");

  const order = [ranked.mutuals, ranked.followsYou, ranked.followers, ranked.id];
  const rows = await db
    .select()
    .from(ranked)
    .where(before(order, readCursor(cursor, order.length)))
    .orderBy(...order.map((column) => desc(column)))
    .limit(limit + 1);
  return toPage(rows, limit, (reader) => [
    reader.mutuals,
    reader.followsYou ? 1 : 0,
    reader.followers,
    reader.id,
  ]);
}

/**
 * People who follow `userId` (`kind: "followers"`) or whom `userId` follows ("following"),
 * most recent first. Keyset on (follow date, reader id).
 */
export async function listConnections(
  db: Database,
  {
    userId,
    kind,
    viewerId,
    cursor,
    limit,
  }: {
    userId: string;
    kind: "followers" | "following";
    viewerId: string | null;
    cursor?: string;
    limit: number;
  },
) {
  const [self, other] =
    kind === "followers"
      ? [follows.followingId, follows.followerId]
      : [follows.followerId, follows.followingId];
  const rows = await db
    .select({ ...readerCardColumns(viewerId), since: follows.createdAt })
    .from(follows)
    .innerJoin(users, eq(users.id, other))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(and(eq(self, userId), before([follows.createdAt, users.id], readCursor(cursor, 2))))
    .orderBy(desc(follows.createdAt), desc(users.id))
    .limit(limit + 1);
  return toPage(rows, limit, (reader) => [reader.since.getTime(), reader.id]);
}

/** The books shown on a profile: reading now, favorites (best rated reads) and the total. */
export async function getProfileBooks(db: Database, userId: string) {
  const [rows, total] = await Promise.all([
    db
      .select({ entry: shelfEntries, book: books })
      .from(shelfEntries)
      .innerJoin(books, eq(books.id, shelfEntries.bookId))
      .where(
        and(eq(shelfEntries.userId, userId), inArray(shelfEntries.status, ["reading", "read"])),
      )
      .orderBy(desc(shelfEntries.updatedAt)),
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(shelfEntries)
      .where(eq(shelfEntries.userId, userId))
      .get(),
  ]);
  const reading = rows.filter(({ entry }) => entry.status === "reading");
  const favorites = rows
    .filter(({ entry }) => entry.status === "read" && entry.rating)
    .sort((a, b) => (b.entry.rating ?? 0) - (a.entry.rating ?? 0))
    .slice(0, 10);
  const covers = rows.flatMap(({ book }) => (book.coverUrl ? [book.coverUrl] : [])).slice(0, 24);
  return { reading, favorites, covers, total: total?.count ?? 0 };
}
