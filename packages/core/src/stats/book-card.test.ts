import { describe, expect, it } from "vitest";
import { buildFinishedCard, buildQuoteCard, formatCardRating, quoteFontSize } from "./book-card";

const book = { title: "Duna", authors: ["Frank Herbert"], coverUrl: null };
const DAY = 24 * 60 * 60 * 1000;

describe("book cards", () => {
  it("says how long the book took and computes pacing", () => {
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
      details: {
        pages: 600,
        days: 12,
        pagesPerDay: 50,
      },
      username: "rafa",
    });
    expect(
      buildFinishedCard(book, { rating: null, startedAt: null, finishedAt: 0 }, null, null).summary,
    ).toBeNull();
  });

  it("maps genre, feelings, review excerpt, year rank and up to 3 diary highlights", () => {
    const start = Date.UTC(2026, 9, 10, 12);
    const finish = Date.UTC(2026, 9, 22, 12);
    const card = buildFinishedCard(
      book,
      { rating: 4.5, startedAt: start, finishedAt: finish },
      256,
      "rafa",
      {
        genres: ["science_fiction"],
        publishedYear: 1965,
        feelings: ["curiosidade", "tensao", "inspiracao", "alegria"],
        pastReads: 1,
        reviewBody:
          "   Um clássico absoluto de construção de mundo.   Cada capítulo prende mais que o anterior e faz pensar muito sobre poder e ecologia no deserto.   ",
        diaryMarks: [
          { page: 40, feelings: ["curiosidade"] },
          { page: 120, feelings: ["tensao"] },
          { page: 180, feelings: ["surpresa"] },
          { page: 256, feelings: ["inspiracao"] },
        ],
        yearRank: { index: 11, year: 2026, target: 24 },
      },
    );

    expect(card.details).toMatchObject({
      pages: 256,
      days: 12,
      pagesPerDay: 21,
      periodRange: "10 out – 22 out",
      finishedMonth: "OUT 2026",
      finishedStamp: "OUT/26",
      genre: "Ficção científica",
      publishedYear: 1965,
      feelings: ["Curiosidade", "Tensão", "Inspiração"],
      yearRank: { index: 11, year: 2026, target: 24 },
      rereadCount: 1,
    });
    expect(card.details?.diaryMarks).toEqual([
      { page: 40, feelings: ["Curiosidade"] },
      { page: 120, feelings: ["Tensão"] },
      { page: 256, feelings: ["Inspiração"] },
    ]);
    expect(card.details?.reviewExcerpt?.length).toBeLessThanOrEqual(142);
    expect(card.details?.reviewExcerpt).toContain("clássico absoluto");
    expect(formatCardRating(4.5)).toBe("4,5");
  });

  it("carries the quote and shrinks long ones", () => {
    expect(buildQuoteCard(book, { body: "O medo mata a mente.", page: 12 }, "bia")).toMatchObject({
      kind: "quote",
      quote: { body: "O medo mata a mente.", page: 12 },
    });
    expect(quoteFontSize("curta")).toBeGreaterThan(quoteFontSize("a".repeat(500)));
  });
});
