import { computeMonthlySummary, monthRange, mostFrequent, yearRange } from "@grimo/core";
import { books, type Database, readingGoals, readingLogs, shelfEntries } from "@grimo/db";
import { and, eq, gte, lt, sql } from "drizzle-orm";

type Range = { start: Date; end: Date };

function finishedBooks(db: Database, userId: string, range: Range) {
  return db
    .select({
      bookId: books.id,
      title: books.title,
      authors: books.authors,
      coverUrl: books.coverUrl,
      genres: books.genres,
      rating: shelfEntries.rating,
    })
    .from(shelfEntries)
    .innerJoin(books, eq(books.id, shelfEntries.bookId))
    .where(
      and(
        eq(shelfEntries.userId, userId),
        eq(shelfEntries.status, "read"),
        gte(shelfEntries.finishedAt, range.start),
        lt(shelfEntries.finishedAt, range.end),
      ),
    );
}

async function pagesRead(db: Database, userId: string, range: Range) {
  const row = await db
    .select({ total: sql<number>`coalesce(sum(${readingLogs.pagesRead}), 0)` })
    .from(readingLogs)
    .where(
      and(
        eq(readingLogs.userId, userId),
        gte(readingLogs.createdAt, range.start),
        lt(readingLogs.createdAt, range.end),
      ),
    )
    .get();
  return Number(row?.total ?? 0);
}

async function goalTarget(db: Database, userId: string, year: number) {
  const goal = await db.query.readingGoals.findFirst({
    where: and(eq(readingGoals.userId, userId), eq(readingGoals.year, year)),
  });
  return goal?.target ?? null;
}

export async function getYearOverview(db: Database, userId: string, year: number) {
  const range = yearRange(year);
  const [finished, pages, target] = await Promise.all([
    finishedBooks(db, userId, range),
    pagesRead(db, userId, range),
    goalTarget(db, userId, year),
  ]);
  return {
    year,
    booksRead: finished.length,
    pagesRead: pages,
    topGenre: mostFrequent(finished.flatMap((book) => book.genres)),
    goal: target ? { target, done: finished.length } : null,
  };
}

export async function getMonthlySummary(db: Database, userId: string, month: string) {
  const range = monthRange(month);
  const year = range.start.getUTCFullYear();
  const [finished, pages, target, yearFinished] = await Promise.all([
    finishedBooks(db, userId, range),
    pagesRead(db, userId, range),
    goalTarget(db, userId, year),
    finishedBooks(db, userId, yearRange(year)),
  ]);
  return computeMonthlySummary({
    month,
    finished,
    pagesRead: pages,
    goal: target ? { target, finishedThisYear: yearFinished.length } : null,
  });
}
