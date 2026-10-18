import { z } from "zod";

/** A book as returned by search (external source) — enough to persist it locally. */
export const bookInputSchema = z.object({
  openLibraryId: z.string().min(1),
  title: z.string().min(1),
  authors: z.array(z.string()).default([]),
  coverUrl: z.url().nullable().default(null),
  pageCount: z.number().int().positive().nullable().default(null),
  publishedYear: z.number().int().nullable().default(null),
  genres: z.array(z.string()).default([]),
});
export type BookInput = z.infer<typeof bookInputSchema>;

export const bookSearchQuerySchema = z.object({
  q: z.string().trim().min(2).max(120),
});
