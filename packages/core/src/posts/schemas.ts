import { z } from "zod";
import { ratingSchema } from "../shelves/schemas";

/**
 * `update` is the post of a shelf activity in the feed ("está lendo", "terminou"): it holds the
 * note written when marking the page, and the likes and comments on that update. Readers write
 * reviews and notes; updates come from the shelf (`shelves.update`) or the first reaction.
 */
export const POST_KINDS = ["review", "note", "update"] as const;
export type PostKind = (typeof POST_KINDS)[number];

export const createPostSchema = z
  .object({
    kind: z.enum(["review", "note"]),
    bookId: z.string().nullable().default(null),
    rating: ratingSchema.nullable().default(null),
    body: z.string().trim().min(1).max(5000),
    hasSpoilers: z.boolean().default(false),
  })
  .refine((post) => post.kind !== "review" || post.bookId, {
    message: "Resenhas precisam de um livro",
    path: ["bookId"],
  });
export type CreatePostInput = z.infer<typeof createPostSchema>;

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
