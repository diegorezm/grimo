import { z } from "zod";
import { ratingSchema } from "../shelves/schemas";

/**
 * `quote` is a passage of a book with its page (Skoob's citações). `update` is the post of a
 * shelf activity in the feed ("está lendo", "terminou"): it holds the
 * note written when marking the page, and the likes and comments on that update. Readers write
 * reviews and notes; updates come from the shelf (`shelves.update`) or the first reaction.
 */
export const POST_KINDS = ["review", "note", "quote", "update"] as const;
export type PostKind = (typeof POST_KINDS)[number];

/** A quote is a passage, not a chapter. */
export const QUOTE_MAX_LENGTH = 1000;

export const createPostSchema = z
  .object({
    kind: z.enum(["review", "note", "quote"]),
    bookId: z.string().nullable().default(null),
    rating: ratingSchema.nullable().default(null),
    body: z.string().trim().min(1, "Escreva alguma coisa").max(5000),
    hasSpoilers: z.boolean().default(false),
    /** Where a quote is in the book. */
    page: z
      .number({ error: "Página inválida" })
      .int("Página inválida")
      .positive("Página inválida")
      .max(100_000, "Página inválida")
      .nullable()
      .default(null),
  })
  .refine((post) => post.kind === "note" || post.bookId, {
    message: "Escolha o livro",
    path: ["bookId"],
  })
  .refine((post) => post.kind !== "quote" || post.body.length <= QUOTE_MAX_LENGTH, {
    message: `Uma citação tem até ${QUOTE_MAX_LENGTH} caracteres`,
    path: ["body"],
  });
/** What a form sends (defaults filled by the schema). */
export type CreatePostInput = z.input<typeof createPostSchema>;

/** The optional note written when marking the page or finishing a book. */
export const updateNoteSchema = z.object({
  body: z.string().trim().min(1, "Escreva alguma coisa").max(2000, "Comentário longo demais"),
  hasSpoilers: z.boolean().default(false),
});
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

export const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

/** "1 comentário", "3 comentários". */
export const commentCountLabel = (count: number) =>
  `${count} ${count === 1 ? "comentário" : "comentários"}`;
