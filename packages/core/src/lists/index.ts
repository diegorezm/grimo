import { z } from "zod";

/** Lists one reader can keep, and books in one list: generous, and keeps every read bounded. */
export const MAX_LISTS = 100;
export const MAX_LIST_ITEMS = 200;

/**
 * A list curated by a reader ("terror para começar", "melhores de 2026"), public like the rest of
 * the profile.
 */
export const listSchema = z.object({
  title: z.string().trim().min(1, "Dê um nome à lista").max(80, "Nome longo demais"),
  description: z.string().trim().max(500, "Descrição longa demais").default(""),
});
export type ListInput = z.input<typeof listSchema>;

/** Why a book is on the list, in a line. */
export const listNoteSchema = z
  .string()
  .trim()
  .max(280, "Nota longa demais")
  .transform((note) => note || null)
  .nullable()
  .default(null);

/** "1 livro", "12 livros". */
export const bookCountLabel = (count: number) => `${count} ${count === 1 ? "livro" : "livros"}`;
