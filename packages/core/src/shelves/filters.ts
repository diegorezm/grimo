import { z } from "zod";
import { GENRES } from "../books/genres";
import { SHELF_STATUSES, type ShelfStatus } from "./constants";

/**
 * One shelf, many views: the reader's books filtered by status, genre (from the catalog) and
 * personal tags ("Tenho", "Kindle", "Emprestei"). A combination can be saved as a named shelf
 * ("Minha estante física" = tag Tenho), which stays up to date by itself.
 */

/** Personal tags a reader can create. */
export const MAX_TAGS = 30;
/** Tags on one book. */
export const MAX_TAGS_PER_BOOK = 10;
/** Saved shelves a reader can have. */
export const MAX_SAVED_SHELVES = 20;
/** Books tagged in one go (select mode). */
export const MAX_BULK_TAG = 100;

/**
 * Statuses anyone may see on a profile (Privacy Policy: what you are reading and have read).
 * "Quero ler" and "Abandonei" stay with the owner.
 */
export const PUBLIC_SHELF_STATUSES = ["reading", "read"] as const satisfies readonly ShelfStatus[];

export const tagNameSchema = z
  .string()
  .trim()
  .min(1, "Dê um nome ao marcador")
  .max(30, "Use até 30 caracteres");

export interface ShelfFilter {
  /** Empty: every status. */
  statuses: ShelfStatus[];
  /** Empty: every genre. A book matches if it has any of them. */
  genres: string[];
  /** Empty: tagged or not. A book matches if it has any of them. */
  tagIds: string[];
}

export const EMPTY_SHELF_FILTER: ShelfFilter = { statuses: [], genres: [], tagIds: [] };

export const shelfFilterSchema = z.object({
  statuses: z.array(z.enum(SHELF_STATUSES)).max(SHELF_STATUSES.length),
  genres: z.array(z.enum(GENRES)).max(GENRES.length),
  tagIds: z.array(z.string()).max(MAX_TAGS),
});

export const savedShelfSchema = z.object({
  name: z.string().trim().min(1, "Dê um nome à estante").max(40, "Use até 40 caracteres"),
  filter: shelfFilterSchema.refine(
    (filter) => filter.statuses.length + filter.genres.length + filter.tagIds.length > 0,
    "Escolha pelo menos um filtro para salvar",
  ),
  isPublic: z.boolean(),
});
export type SavedShelfInput = z.infer<typeof savedShelfSchema>;

export const isFilterEmpty = (filter: ShelfFilter) =>
  filter.statuses.length === 0 && filter.genres.length === 0 && filter.tagIds.length === 0;

const matchesAny = (wanted: readonly string[], have: readonly string[]) =>
  wanted.length === 0 || wanted.some((value) => have.includes(value));

/** Whether a shelf row passes the filter: every kind of filter must match (any value of it). */
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
