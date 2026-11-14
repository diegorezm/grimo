import { z } from "zod";
import type { ShelfStatus } from "./constants";

/**
 * Shelves the reader makes ("Física", "Kindle", "Emprestei"): a book can be on any number of
 * them. The reading status (Quero ler, Lendo, Lidos, Abandonei) is not a shelf: it is a filter
 * inside every shelf, with the genre. "Todos os meus livros" is every book.
 */

/** Shelves a reader can make. */
export const MAX_SHELVES = 50;
/** Shelves one book can be on. */
export const MAX_SHELVES_PER_BOOK = 20;
/** Books changed in one go (select mode). */
export const MAX_BULK_BOOKS = 500;
export const MAX_SHELF_NAME = 40;

/**
 * Statuses anyone may see on a profile (Privacy Policy: what you are reading and have read).
 * "Quero ler" and "Abandonei" stay with the owner, in public shelves too.
 */
export const PUBLIC_SHELF_STATUSES = ["reading", "read"] as const satisfies readonly ShelfStatus[];

export const shelfNameSchema = z
  .string()
  .trim()
  .min(1, "Dê um nome à estante")
  .max(MAX_SHELF_NAME, `Use até ${MAX_SHELF_NAME} caracteres`);

/** "Física" → "Física (cópia)", within the name limit. */
export function copyName(name: string): string {
  const suffix = " (cópia)";
  return `${name.slice(0, MAX_SHELF_NAME - suffix.length).trim()}${suffix}`;
}

export interface ShelfFilter {
  /** Empty: every status. */
  statuses: ShelfStatus[];
  /** Empty: every genre. A book matches if it has any of them. */
  genres: string[];
  /** Empty: on any shelf or none. A book matches if it is on any of them. */
  tagIds: string[];
}

export const EMPTY_SHELF_FILTER: ShelfFilter = { statuses: [], genres: [], tagIds: [] };

export const isFilterEmpty = (filter: ShelfFilter) =>
  filter.statuses.length === 0 && filter.genres.length === 0 && filter.tagIds.length === 0;

const matchesAny = (wanted: readonly string[], have: readonly string[]) =>
  wanted.length === 0 || wanted.some((value) => have.includes(value));

/** Whether a row passes the filter: every kind of filter must match (any value of it). */
export function matchesShelfFilter(
  row: {
    entry: { status: ShelfStatus; tagIds: readonly string[] };
    book: { genres: readonly string[] };
  },
  filter: ShelfFilter,
): boolean {
  return (
    matchesAny(filter.statuses, [row.entry.status]) &&
    matchesAny(filter.genres, row.book.genres) &&
    matchesAny(filter.tagIds, row.entry.tagIds)
  );
}

/** Adds or removes a value from one kind of filter. */
export function toggleFilter<K extends keyof ShelfFilter>(
  filter: ShelfFilter,
  key: K,
  value: ShelfFilter[K][number],
): ShelfFilter {
  const current = filter[key] as string[];
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
  return { ...filter, [key]: next };
}

/** The genres present in these books, most common first: the genre filter's chips. */
export function shelfGenres(rows: readonly { book: { genres: readonly string[] } }[]): string[] {
  const counts = new Map<string, number>();
  for (const { book } of rows) {
    for (const genre of new Set(book.genres)) counts.set(genre, (counts.get(genre) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([genre]) => genre);
}
