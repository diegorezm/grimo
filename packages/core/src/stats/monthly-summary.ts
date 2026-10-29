import { z } from "zod";
import { MONTH_KEY_REGEX } from "../lib/date";

export const monthlySummaryQuerySchema = z.object({
  month: z.string().regex(MONTH_KEY_REGEX, "Use o formato YYYY-MM"),
});

export const yearlySummaryQuerySchema = z.object({
  year: z.number().int("Ano inválido").min(1900, "Ano inválido").max(2200, "Ano inválido"),
});

export interface FinishedBook {
  bookId: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  genres: string[];
  rating: number | null;
}

export interface ReadingSummaryInput {
  finished: FinishedBook[];
  pagesRead: number;
  goal: { target: number; finishedThisYear: number } | null;
}

export interface MonthlySummaryInput extends ReadingSummaryInput {
  month: string;
}

export interface GoalProgress {
  target: number;
  done: number;
  /** 0–100, capped. */
  percent: number;
}

export interface ReadingSummary {
  booksRead: number;
  pagesRead: number;
  topGenre: string | null;
  favoriteBook: FinishedBook | null;
  /** Books finished this month, best rated first (for the shareable card's shelf). */
  books: FinishedBook[];
  goal: GoalProgress | null;
}

export interface MonthlySummary extends ReadingSummary {
  month: string;
}

export interface YearlySummary extends ReadingSummary {
  year: number;
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

/** Pure: shared by the API (card queries) and the clients (card preview). */
export function computeReadingSummary(input: ReadingSummaryInput): ReadingSummary {
  let favoriteBook: FinishedBook | null = null;
  for (const book of input.finished) {
    if (!favoriteBook || (book.rating ?? 0) > (favoriteBook.rating ?? 0)) favoriteBook = book;
  }

  return {
    booksRead: input.finished.length,
    pagesRead: input.pagesRead,
    topGenre: mostFrequent(input.finished.flatMap((book) => book.genres)),
    favoriteBook,
    books: [...input.finished].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)),
    goal: input.goal ? goalProgress(input.goal.target, input.goal.finishedThisYear) : null,
  };
}

export function computeMonthlySummary({ month, ...input }: MonthlySummaryInput): MonthlySummary {
  return { month, ...computeReadingSummary(input) };
}

/** The year in review ("retrospectiva"): the same numbers as the month, over the whole year. */
export function computeYearlySummary(year: number, input: ReadingSummaryInput): YearlySummary {
  return { year, ...computeReadingSummary(input) };
}
