import { z } from "zod";
import { isOpenLibraryCover } from "./cover";

/** Open Library work ids (`OL45804W`): the only books Grimo saves. */
export const OPEN_LIBRARY_WORK_ID = /^OL\d+W$/;

/** Long lists from Open Library are trimmed, not refused: the book is still valid. */
const shortList = (maxItems: number, maxLength: number) =>
  z
    .array(z.string())
    .default([])
    .transform((items) =>
      items
        .map((item) => item.trim())
        .filter((item) => item.length > 0 && item.length <= maxLength)
        .slice(0, maxItems),
    );

/**
 * A book as returned by search (external source) — enough to persist it locally. The first
 * reader to shelve a book creates it for everyone, so the server checks it with this schema (and
 * then refreshes it from Open Library, see `books.refreshBook`).
 */
export const bookInputSchema = z.object({
  openLibraryId: z.string().regex(OPEN_LIBRARY_WORK_ID, "Esse livro não é do Open Library"),
  title: z.string().trim().min(1).max(500),
  authors: shortList(10, 200),
  // Everyone who sees the book loads its cover: only Open Library's, never any other host.
  coverUrl: z
    .url()
    .refine(isOpenLibraryCover, "A capa precisa ser do Open Library")
    .nullable()
    .default(null),
  pageCount: z.number().int().positive().max(100_000).nullable().default(null),
  publishedYear: z.number().int().min(-5000).max(3000).nullable().default(null),
  genres: shortList(10, 100),
});
export type BookInput = z.infer<typeof bookInputSchema>;

export const bookSearchQuerySchema = z.object({
  q: z.string().trim().min(2).max(120),
});
