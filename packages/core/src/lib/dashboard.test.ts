import { describe, expect, it } from "vitest";
import {
  countByShelf,
  finishedPerMonth,
  genreBreakdown,
  greetingFor,
  readingPercent,
  timeAgo,
} from "./dashboard";

describe("greetingFor", () => {
  it("follows the time of day", () => {
    expect(greetingFor(new Date(2026, 9, 18, 8))).toBe("Bom dia");
    expect(greetingFor(new Date(2026, 9, 18, 14))).toBe("Boa tarde");
    expect(greetingFor(new Date(2026, 9, 18, 21))).toBe("Boa noite");
    expect(greetingFor(new Date(2026, 9, 18, 2))).toBe("Boa noite");
  });
});

describe("readingPercent", () => {
  it("rounds and clamps, and is null without a page count", () => {
    expect(readingPercent(312, 680)).toBe(46);
    expect(readingPercent(900, 680)).toBe(100);
    expect(readingPercent(10, null)).toBeNull();
  });
});

describe("countByShelf", () => {
  it("counts every shelf and the total", () => {
    const counts = countByShelf([{ status: "reading" }, { status: "read" }, { status: "read" }]);
    expect(counts).toEqual({ want_to_read: 0, reading: 1, read: 2, abandoned: 0, all: 3 });
  });
});

describe("timeAgo", () => {
  it("picks the largest unit", () => {
    const now = new Date(2026, 9, 18, 12);
    expect(timeAgo(new Date(2026, 9, 18, 11, 59, 40), now)).toBe("agora");
    expect(timeAgo(new Date(2026, 9, 18, 11, 30), now)).toBe("há 30 min");
    expect(timeAgo(new Date(2026, 9, 18, 9), now)).toBe("há 3 h");
    expect(timeAgo(new Date(2026, 9, 16, 12), now)).toBe("há 2 d");
  });
});

describe("finishedPerMonth", () => {
  it("counts only books read in that year", () => {
    const months = finishedPerMonth(
      [
        { status: "read", finishedAt: new Date(2026, 0, 19) },
        { status: "read", finishedAt: new Date(2026, 9, 3) },
        { status: "read", finishedAt: new Date(2026, 9, 12) },
        { status: "read", finishedAt: new Date(2025, 9, 12) },
        { status: "reading", finishedAt: null },
      ],
      2026,
    );
    expect(months[0]).toBe(1);
    expect(months[9]).toBe(2);
    expect(months.reduce((a, b) => a + b)).toBe(3);
  });
});

describe("genreBreakdown", () => {
  it("ranks genres by frequency and limits the list", () => {
    const books = [
      { genres: ["fantasy"] },
      { genres: ["fantasy", "classics"] },
      { genres: ["horror"] },
    ];
    expect(genreBreakdown(books, 2)).toEqual([
      { genre: "fantasy", count: 2 },
      { genre: "classics", count: 1 },
    ]);
  });
});
