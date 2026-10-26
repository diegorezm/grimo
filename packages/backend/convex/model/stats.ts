import { computeMonthlySummary, monthRange, mostFrequent, yearRange } from "@grimo/core";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { timeZoneOf } from "./readers";

type Range = { start: Date; end: Date };

async function finishedBooks(ctx: QueryCtx, userId: Id<"users">, range: Range) {
  const entries = await ctx.db
    .query("shelfEntries")
    .withIndex("by_user_status_finished", (q) =>
      q
        .eq("userId", userId)
        .eq("status", "read")
        .gte("finishedAt", range.start.getTime())
        .lt("finishedAt", range.end.getTime()),
    )
    .collect();
  const rows = await Promise.all(
    entries.map(async (entry) => {
      const book = await ctx.db.get(entry.bookId);
      if (!book) return null;
      return {
        bookId: book._id as string,
        title: book.title,
        authors: book.authors,
        coverUrl: book.coverUrl,
        genres: book.genres,
        rating: entry.rating,
      };
    }),
  );
  return rows.filter((row) => row !== null);
}

async function pagesRead(ctx: QueryCtx, userId: Id<"users">, range: Range) {
  const logs = await ctx.db
    .query("readingLogs")
    .withIndex("by_user_created", (q) =>
      q
        .eq("userId", userId)
        .gte("createdAt", range.start.getTime())
        .lt("createdAt", range.end.getTime()),
    )
    .collect();
  return logs.reduce((total, log) => total + log.pagesRead, 0);
}

async function goalTarget(ctx: QueryCtx, userId: Id<"users">, year: number) {
  const goal = await ctx.db
    .query("readingGoals")
    .withIndex("by_user_year", (q) => q.eq("userId", userId).eq("year", year))
    .unique();
  return goal?.target ?? null;
}

/** Books and pages of `year`, counted in the reader's time zone. */
export async function yearOverview(ctx: QueryCtx, user: Doc<"users">, year: number) {
  const userId = user._id;
  const range = yearRange(year, timeZoneOf(user));
  const [finished, pages, target] = await Promise.all([
    finishedBooks(ctx, userId, range),
    pagesRead(ctx, userId, range),
    goalTarget(ctx, userId, year),
  ]);
  return {
    year,
    booksRead: finished.length,
    pagesRead: pages,
    topGenre: mostFrequent(finished.flatMap((book) => book.genres)),
    goal: target ? { target, done: finished.length } : null,
  };
}

export async function monthlySummary(ctx: QueryCtx, user: Doc<"users">, month: string) {
  const userId = user._id;
  const timeZone = timeZoneOf(user);
  const range = monthRange(month, timeZone);
  const year = Number(month.slice(0, 4));
  const [finished, pages, target, yearFinished] = await Promise.all([
    finishedBooks(ctx, userId, range),
    pagesRead(ctx, userId, range),
    goalTarget(ctx, userId, year),
    finishedBooks(ctx, userId, yearRange(year, timeZone)),
  ]);
  return computeMonthlySummary({
    month,
    finished,
    pagesRead: pages,
    goal: target ? { target, finishedThisYear: yearFinished.length } : null,
  });
}
