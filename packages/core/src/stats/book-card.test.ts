import { describe, expect, it } from "vitest";
import { buildFinishedCard, buildQuoteCard, quoteFontSize } from "./book-card";

const book = { title: "Duna", authors: ["Frank Herbert"], coverUrl: null };
const DAY = 24 * 60 * 60 * 1000;

describe("book cards", () => {
  it("says how long the book took", () => {
    const card = buildFinishedCard(
      book,
      { rating: 5, startedAt: 0, finishedAt: 12 * DAY - 1000 },
      600,
      "rafa",
    );
    expect(card).toMatchObject({
      headline: "Terminei de ler",
      summary: "600 páginas · em 12 dias",
      book: { title: "Duna", rating: 5 },
      username: "rafa",
    });
    expect(
      buildFinishedCard(book, { rating: null, startedAt: null, finishedAt: 0 }, null, null).summary,
    ).toBeNull();
  });

  it("carries the quote and shrinks long ones", () => {
    expect(buildQuoteCard(book, { body: "O medo mata a mente.", page: 12 }, "bia")).toMatchObject({
      kind: "quote",
      quote: { body: "O medo mata a mente.", page: 12 },
    });
    expect(quoteFontSize("curta")).toBeGreaterThan(quoteFontSize("a".repeat(500)));
  });
});
