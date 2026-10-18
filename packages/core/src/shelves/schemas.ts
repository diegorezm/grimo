import { z } from "zod";
import { bookInputSchema } from "../books/schemas";
import { SHELF_STATUSES } from "./constants";

export const shelfStatusSchema = z.enum(SHELF_STATUSES);
export const ratingSchema = z.number().int().min(1).max(5);

export const addToShelfSchema = z.object({
  book: bookInputSchema,
  status: shelfStatusSchema,
});
export type AddToShelfInput = z.infer<typeof addToShelfSchema>;

export const updateShelfEntrySchema = z.object({
  status: shelfStatusSchema.optional(),
  currentPage: z.number().int().min(0).optional(),
  rating: ratingSchema.nullable().optional(),
  startedAt: z.coerce.date().nullable().optional(),
  finishedAt: z.coerce.date().nullable().optional(),
});
export type UpdateShelfEntryInput = z.infer<typeof updateShelfEntrySchema>;

export const shelfQuerySchema = z.object({
  status: shelfStatusSchema.optional(),
});
