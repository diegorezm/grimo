import { z } from "zod";
import { ratingSchema } from "../shelves/schemas";

export const POST_KINDS = ["review", "note"] as const;
export type PostKind = (typeof POST_KINDS)[number];

export const createPostSchema = z
  .object({
    kind: z.enum(POST_KINDS),
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

export const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

/** "1 comentário", "3 comentários". */
export const commentCountLabel = (count: number) =>
  `${count} ${count === 1 ? "comentário" : "comentários"}`;
