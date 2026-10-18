import { z } from "zod";
import { MONTH_KEY_REGEX } from "../lib/date";

export const monthlySummaryQuerySchema = z.object({
  month: z.string().regex(MONTH_KEY_REGEX, "Use o formato YYYY-MM"),
});

export interface FinishedBook {
  bookId: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  genres: string[];
  rating: number | null;
}

export interface MonthlySummaryInput {
  month: string;
  finished: FinishedBook[];
  pagesRead: number;
  goal: { target: number; finishedThisYear: number } | null;
}

export interface GoalProgress {
  target: number;
  done: number;
  /** 0–100, capped. */
  percent: number;
}

export interface MonthlySummary {
  month: string;
  booksRead: number;
  pagesRead: number;
  topGenre: string | null;
  favoriteBook: FinishedBook | null;
  goal: GoalProgress | null;
}

export function goalProgress(target: number, done: number): GoalProgress {
  const percent = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
  return { target, done, percent };
}

/** Most frequent value; ties resolve to the first one seen. */
export function mostFrequent(values: string[]): string | null {
  const counts = new Map<string, number>();
  let best: string | null = null;
  for (const value of values) {
    const count = (counts.get(value) ?? 0) + 1;
    counts.set(value, count);
    if (best === null || count > (counts.get(best) ?? 0)) best = value;
  }
  return best;
}

/** Pure: shared by the API (card endpoint) and the clients (card preview). */
export function computeMonthlySummary(input: MonthlySummaryInput): MonthlySummary {
  let favoriteBook: FinishedBook | null = null;
  for (const book of input.finished) {
    if (!favoriteBook || (book.rating ?? 0) > (favoriteBook.rating ?? 0)) favoriteBook = book;
  }

  return {
    month: input.month,
    booksRead: input.finished.length,
    pagesRead: input.pagesRead,
    topGenre: mostFrequent(input.finished.flatMap((book) => book.genres)),
    favoriteBook,
    goal: input.goal ? goalProgress(input.goal.target, input.goal.finishedThisYear) : null,
  };
}
