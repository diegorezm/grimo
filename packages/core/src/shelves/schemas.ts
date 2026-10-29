import { z } from "zod";
import { bookInputSchema } from "../books/schemas";
import { SHELF_STATUSES } from "./constants";

export const shelfStatusSchema = z.enum(SHELF_STATUSES);
export const ratingSchema = z.number().int().min(1).max(5);

/** Longest book we accept progress for; keeps a typo from becoming 999999999 pages read. */
export const MAX_CURRENT_PAGE = 20000;

export const addToShelfSchema = z.object({
  book: bookInputSchema,
  status: shelfStatusSchema,
});
export type AddToShelfInput = z.infer<typeof addToShelfSchema>;

export const updateShelfEntrySchema = z.object({
  status: shelfStatusSchema.optional(),
  currentPage: z.number().int().min(0).max(MAX_CURRENT_PAGE).optional(),
  rating: ratingSchema.nullable().optional(),
  startedAt: z.coerce.date().nullable().optional(),
  finishedAt: z.coerce.date().nullable().optional(),
  /** Pages in your edition; null goes back to the book's. */
  pageCount: z
    .number({ error: "Número de páginas inválido" })
    .int("Número de páginas inválido")
    .positive("Número de páginas inválido")
    .max(MAX_CURRENT_PAGE, `No máximo ${MAX_CURRENT_PAGE} páginas`)
    .nullable()
    .optional(),
});
export type UpdateShelfEntryInput = z.infer<typeof updateShelfEntrySchema>;

export const shelfQuerySchema = z.object({
  status: shelfStatusSchema.optional(),
});
