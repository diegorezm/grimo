import { type DecorFacts, longestStreak, toDayKey, yearOf } from "@grimo/core";
import type { Doc } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { timeZoneOf } from "./readers";

/** Days of reading looked at for the longest run of days in a row. */
const STREAK_LOOKBACK_DAYS = 400;
const DAY = 24 * 60 * 60 * 1000;

/**
 * What a reader has done, for what the objects on their shelves earn (`decorProgress` in
 * `@grimo/core`): books read (all and this year), the year's goal, genres, days in a row,
 * reviews and groups. `entries` are the reader's shelf entries, when the caller has them.
 */
export async function decorFactsOf(
  ctx: QueryCtx,
  user: Doc<"users">,
  entries?: Doc<"shelfEntries">[],
): Promise<DecorFacts> {
  const timeZone = timeZoneOf(user);
  const now = Date.now();
  const year = yearOf(new Date(now), timeZone);
  const since = now - STREAK_LOOKBACK_DAYS * DAY;
  const read = (
    entries ??
    (await ctx.db
      .query("shelfEntries")
      .withIndex("by_user_status_finished", (q) => q.eq("userId", user._id).eq("status", "read"))
      .collect())
  ).filter((entry) => entry.status === "read");
  const [books, goal, logs, sessions, review, group] = await Promise.all([
    Promise.all(read.map((entry) => ctx.db.get(entry.bookId))),
    ctx.db
      .query("readingGoals")
      .withIndex("by_user_year", (q) => q.eq("userId", user._id).eq("year", year))
      .unique(),
    ctx.db
      .query("readingLogs")
      .withIndex("by_user_created", (q) => q.eq("userId", user._id).gte("createdAt", since))
      .collect(),
    ctx.db
      .query("readingSessions")
      .withIndex("by_user_started", (q) => q.eq("userId", user._id).gte("startedAt", since))
      .collect(),
    ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .filter((q) => q.eq(q.field("kind"), "review"))
      .first(),
    ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first(),
  ]);
  const days = [
    ...logs.map((log) => log.createdAt),
    ...sessions.flatMap((session) => (session.endedAt === null ? [] : [session.endedAt])),
  ].map((at) => toDayKey(new Date(at), timeZone));
  return {
    booksRead: read.length,
    readThisYear: read.filter(
      (entry) => entry.finishedAt !== null && yearOf(new Date(entry.finishedAt), timeZone) === year,
    ).length,
    goal: goal?.target ?? null,
    genresRead: new Set(books.flatMap((book) => book?.genres ?? [])).size,
    longestStreak: longestStreak(days),
    reviews: review ? 1 : 0,
    groups: group ? 1 : 0,
  };
}
