import { describe, expect, it } from "vitest";
import { buildCardData, previousPeriod, retrospectiveYear } from "./card";

const summary = {
  booksRead: 6,
  pagesRead: 1500,
  topGenre: "fantasy",
  favoriteBook: null,
  books: [],
  goal: null,
};
const reader = { name: "Rafa", username: "rafa" };

describe("buildCardData", () => {
  it("labels a month and compares with the month before", () => {
    const data = buildCardData(
      { kind: "month", month: "2026-10" },
      summary,
      { booksRead: 3, pagesRead: 2000 },
      reader,
    );
    expect(data).toMatchObject({
      kind: "month",
      periodLabel: "outubro de 2026",
      periodName: "outubro",
      unit: "mês",
      year: 2026,
      genre: "Fantasia",
      deltas: { books: 100, pages: -25 },
    });
    expect(data.previousShort).toMatch(/^set/);
  });

  it("labels a year and leaves deltas empty without a baseline", () => {
    const data = buildCardData({ kind: "year", year: 2026 }, summary, null, reader);
    expect(data).toMatchObject({
      kind: "year",
      periodLabel: "2026",
      periodName: "2026",
      previousShort: "2025",
      unit: "ano",
      deltas: { books: null, pages: null },
    });
  });
});

describe("previousPeriod", () => {
  it("steps back a month across the new year, or a whole year", () => {
    expect(previousPeriod({ kind: "month", month: "2026-01" })).toEqual({
      kind: "month",
      month: "2025-12",
    });
    expect(previousPeriod({ kind: "year", year: 2026 })).toEqual({ kind: "year", year: 2025 });
  });
});

describe("retrospectiveYear", () => {
  it("offers this year in December and last year in January only", () => {
    expect(retrospectiveYear(new Date("2026-12-10T12:00:00Z"), "UTC")).toBe(2026);
    expect(retrospectiveYear(new Date("2027-01-20T12:00:00Z"), "UTC")).toBe(2026);
    expect(retrospectiveYear(new Date("2026-10-28T12:00:00Z"), "UTC")).toBeNull();
  });
});
