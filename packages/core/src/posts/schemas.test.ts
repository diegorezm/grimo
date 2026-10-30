import { describe, expect, it } from "vitest";
import { createPostSchema, QUOTE_MAX_LENGTH } from "./schemas";

describe("createPostSchema", () => {
  it("takes a quote with its page, for a book", () => {
    expect(
      createPostSchema.parse({ kind: "quote", bookId: "b1", body: " O essencial ", page: 72 }),
    ).toMatchObject({ kind: "quote", body: "O essencial", page: 72, rating: null });
    expect(createPostSchema.safeParse({ kind: "quote", body: "Sem livro" }).success).toBe(false);
    expect(
      createPostSchema.safeParse({ kind: "quote", bookId: "b1", body: "x", page: 0 }).success,
    ).toBe(false);
    expect(
      createPostSchema.safeParse({
        kind: "quote",
        bookId: "b1",
        body: "a".repeat(QUOTE_MAX_LENGTH + 1),
      }).success,
    ).toBe(false);
  });

  it("keeps notes free of a book", () => {
    expect(createPostSchema.parse({ kind: "note", body: "Oi" })).toMatchObject({
      bookId: null,
      page: null,
    });
  });
});
