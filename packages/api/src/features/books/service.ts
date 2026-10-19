import { books, type Database, posts, shelfEntries, user as users } from "@grimo/db";
import { and, avg, count, desc, eq, isNotNull } from "drizzle-orm";
import { authorColumns, joinAuthor, postColumns } from "../posts/queries";
import { fetchWork } from "./open-library";

/**
 * Everything the book page shows: the book (from our cache, filled in from Open Library when
 * nobody has shelved it yet), the viewer's shelf entry, community numbers and reviews.
 * Returns null when the book is unknown both locally and on Open Library.
 */
export async function getBookDetail(db: Database, viewerId: string, openLibraryId: string) {
  const [row, work] = await Promise.all([
    db.select().from(books).where(eq(books.openLibraryId, openLibraryId)).get(),
    fetchWork(openLibraryId),
  ]);
  if (!row && !work?.title) return null;

  const book = {
    id: row?.id ?? null,
    openLibraryId,
    title: row?.title ?? work?.title ?? "",
    authors: row?.authors.length ? row.authors : (work?.authors ?? []),
    coverUrl: row?.coverUrl ?? work?.coverUrl ?? null,
    pageCount: row?.pageCount ?? null,
    publishedYear: row?.publishedYear ?? work?.publishedYear ?? null,
    genres: row?.genres.length ? row.genres : (work?.genres ?? []),
    description: work?.description ?? null,
  };

  if (!row) {
    return {
      book,
      entry: null,
      community: { readers: 0, ratings: 0, averageRating: null },
      reviews: [],
    };
  }

  const [entry, stats, reviews] = await Promise.all([
    db
      .select()
      .from(shelfEntries)
      .where(and(eq(shelfEntries.bookId, row.id), eq(shelfEntries.userId, viewerId)))
      .get(),
    db
      .select({
        readers: count(),
        ratings: count(shelfEntries.rating),
        average: avg(shelfEntries.rating),
      })
      .from(shelfEntries)
      .where(eq(shelfEntries.bookId, row.id))
      .get(),
    db
      .select({ ...postColumns(viewerId), author: authorColumns })
      .from(posts)
      .innerJoin(users, joinAuthor)
      .where(and(eq(posts.bookId, row.id), eq(posts.kind, "review"), isNotNull(posts.body)))
      .orderBy(desc(posts.createdAt))
      .limit(20),
  ]);

  return {
    book,
    entry: entry ?? null,
    community: {
      readers: stats?.readers ?? 0,
      ratings: stats?.ratings ?? 0,
      averageRating: stats?.average ? Math.round(Number(stats.average) * 10) / 10 : null,
    },
    reviews,
  };
}
