import { describe, expect, it } from "vitest";
import {
  bookInputSchema,
  isManualBookId,
  manualBookSchema,
  newManualBookId,
  splitAuthors,
} from "./schemas";

const book = {
  openLibraryId: "OL45804W",
  title: "Duna",
  authors: ["Frank Herbert"],
  coverUrl: "https://covers.openlibrary.org/b/id/123-L.jpg",
  pageCount: 600,
  publishedYear: 1965,
  genres: ["science_fiction"],
};

describe("bookInputSchema", () => {
  it("accepts a book from Open Library search", () => {
    expect(bookInputSchema.parse(book)).toEqual(book);
    expect(bookInputSchema.parse({ ...book, coverUrl: null }).coverUrl).toBeNull();
  });

  it("refuses ids and covers that aren't Open Library's", () => {
    expect(bookInputSchema.safeParse({ ...book, openLibraryId: "OL1M" }).success).toBe(false);
    expect(bookInputSchema.safeParse({ ...book, openLibraryId: "../x" }).success).toBe(false);
    for (const coverUrl of [
      "https://tracker.example/pixel.png",
      "https://covers.openlibrary.org.evil.example/b/id/1-L.jpg",
      "http://covers.openlibrary.org/b/id/1-L.jpg",
      "javascript:alert(1)",
    ]) {
      expect(bookInputSchema.safeParse({ ...book, coverUrl }).success).toBe(false);
    }
  });

  it("bounds sizes: long titles are refused, long lists trimmed", () => {
    expect(bookInputSchema.safeParse({ ...book, title: "x".repeat(501) }).success).toBe(false);
    expect(bookInputSchema.safeParse({ ...book, pageCount: 1e9 }).success).toBe(false);
    const parsed = bookInputSchema.parse({
      ...book,
      authors: Array.from({ length: 20 }, (_, i) => `Autor ${i}`),
      genres: ["  fantasy  ", "", "x".repeat(101)],
    });
    expect(parsed.authors).toHaveLength(10);
    expect(parsed.genres).toEqual(["fantasy"]);
  });
});

describe("hand-added books", () => {
  it("have their own ids, accepted next to Open Library's", () => {
    const id = newManualBookId(() => 0.5);
    expect(isManualBookId(id)).toBe(true);
    expect(bookInputSchema.safeParse({ ...book, openLibraryId: id }).success).toBe(true);
    expect(isManualBookId("GRabc")).toBe(false);
  });

  it("need a title and an author", () => {
    const empty = manualBookSchema.safeParse({
      title: " ",
      authors: [],
      pageCount: null,
      publishedYear: null,
    });
    expect(empty.success).toBe(false);
    expect(splitAuthors("Itamar Vieira Junior, Fulana; Sicrano e Beltrana")).toEqual([
      "Itamar Vieira Junior",
      "Fulana",
      "Sicrano",
      "Beltrana",
    ]);
  });
});
