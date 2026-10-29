import { z } from "zod";
import { isOpenLibraryCover } from "./cover";

/** Open Library work ids (`OL45804W`). */
export const OPEN_LIBRARY_WORK_ID = /^OL\d+W$/;
/**
 * Books a reader added by hand (Open Library didn't have them): `GR` + 10 letters/digits. They
 * stay visible only to whoever added them until moderation approves them.
 */
export const MANUAL_BOOK_ID = /^GR[A-Z0-9]{10}$/;
export const isManualBookId = (id: string) => MANUAL_BOOK_ID.test(id);

/** A new id for a hand-added book, from `random` (0–1 numbers). */
export function newManualBookId(random: () => number): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let id = "GR";
  for (let i = 0; i < 10; i++) id += alphabet[Math.floor(random() * alphabet.length)];
  return id;
}

export const BOOK_REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;
export type BookReviewStatus = (typeof BOOK_REVIEW_STATUSES)[number];

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
  openLibraryId: z
    .string()
    .refine(
      (id) => OPEN_LIBRARY_WORK_ID.test(id) || MANUAL_BOOK_ID.test(id),
      "Esse livro não é do Open Library",
    ),
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

/** "Cadastrar livro": what a reader fills in for a book Open Library doesn't have. */
export const manualBookSchema = z.object({
  title: z.string().trim().min(1, "Qual é o título?").max(300, "Título longo demais"),
  authors: z
    .array(z.string().trim().min(1).max(120, "Nome de autor longo demais"))
    .min(1, "Quem escreveu?")
    .max(5, "No máximo 5 autores"),
  pageCount: z
    .number({ error: "Número de páginas inválido" })
    .int("Número de páginas inválido")
    .positive("Número de páginas inválido")
    .max(20000, "No máximo 20000 páginas")
    .nullable(),
  publishedYear: z
    .number({ error: "Ano inválido" })
    .int("Ano inválido")
    .min(1000, "Ano inválido")
    .max(new Date().getFullYear() + 1, "Ano inválido")
    .nullable(),
});
export type ManualBookInput = z.infer<typeof manualBookSchema>;

/** "Itamar Vieira Junior, Fulana" → ["Itamar Vieira Junior", "Fulana"]. */
export const splitAuthors = (text: string) =>
  text
    .split(/[,;]| e /)
    .map((name) => name.trim())
    .filter(Boolean);
