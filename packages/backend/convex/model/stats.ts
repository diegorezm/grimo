import { computeMonthlySummary, monthRange, mostFrequent, yearRange } from "@grimo/core";
import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

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

export async function yearOverview(ctx: QueryCtx, userId: Id<"users">, year: number) {
  const range = yearRange(year);
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

export async function monthlySummary(ctx: QueryCtx, userId: Id<"users">, month: string) {
  const range = monthRange(month);
  const year = range.start.getUTCFullYear();
  const [finished, pages, target, yearFinished] = await Promise.all([
    finishedBooks(ctx, userId, range),
    pagesRead(ctx, userId, range),
    goalTarget(ctx, userId, year),
    finishedBooks(ctx, userId, yearRange(year)),
  ]);
  return computeMonthlySummary({
    month,
    finished,
    pagesRead: pages,
    goal: target ? { target, finishedThisYear: yearFinished.length } : null,
  });
}
