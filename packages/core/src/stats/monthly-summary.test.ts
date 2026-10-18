import { describe, expect, it } from "vitest";
import { computeMonthlySummary, goalProgress, mostFrequent } from "./monthly-summary";

const book = (id: string, rating: number | null, genres: string[]) => ({
  bookId: id,
  title: `Book ${id}`,
  authors: [],
  coverUrl: null,
  genres,
  rating,
});

describe("computeMonthlySummary", () => {
  it("summarizes finished books, top genre, favorite and goal", () => {
    const summary = computeMonthlySummary({
      month: "2026-10",
      pagesRead: 742,
      finished: [
        book("a", 3, ["fantasy"]),
        book("b", 5, ["fantasy", "romance"]),
        book("c", null, []),
      ],
      goal: { target: 24, finishedThisYear: 12 },
    });

    expect(summary.booksRead).toBe(3);
    expect(summary.pagesRead).toBe(742);
    expect(summary.topGenre).toBe("fantasy");
    expect(summary.favoriteBook?.bookId).toBe("b");
    expect(summary.goal).toEqual({ target: 24, done: 12, percent: 50 });
  });

  it("handles an empty month", () => {
    const summary = computeMonthlySummary({
      month: "2026-01",
      pagesRead: 0,
      finished: [],
      goal: null,
    });
    expect(summary).toMatchObject({ booksRead: 0, topGenre: null, favoriteBook: null, goal: null });
  });
});

describe("helpers", () => {
  it("caps goal percent at 100", () => {
    expect(goalProgress(10, 15).percent).toBe(100);
  });

  it("resolves ties to the first value", () => {
    expect(mostFrequent(["a", "b"])).toBe("a");
  });
});
