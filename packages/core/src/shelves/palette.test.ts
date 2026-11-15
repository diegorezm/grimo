import { describe, expect, it } from "vitest";
import { decorLevelsOf, decorProgress, isJustRead, longestStreak, readingProgress } from "./decor";
import { hueOf, spinePalette } from "./palette";

/** `n` RGBA pixels of one color. */
const pixels = (n: number, [r, g, b]: [number, number, number]) =>
  Array.from({ length: n }, () => [r, g, b, 255]).flat();

describe("spinePalette", () => {
  it("takes the cover's main color, a second one and an ink that reads", () => {
    const cover = new Uint8Array([...pixels(70, [20, 40, 120]), ...pixels(30, [240, 200, 60])]);
    expect(spinePalette(cover, 1)).toEqual({ base: "#142878", band: "#f0c83c", ink: "#fff7ec" });
  });

  it("makes a band for a cover of one color and dark ink on a light one", () => {
    const colors = spinePalette(new Uint8Array(pixels(50, [250, 240, 220])), 1)!;
    expect(colors.base).toBe("#faf0dc");
    expect(colors.band).not.toBe(colors.base);
    expect(colors.ink).toBe("#2e2433");
  });

  it("has nothing to say about no pixels", () => {
    expect(spinePalette(new Uint8Array([]))).toBeNull();
    expect(spinePalette(new Uint8Array([0, 0, 0, 0]), 1)).toBeNull();
  });

  it("orders hues like a rainbow", () => {
    expect(hueOf("#cc2222")).toBeLessThan(hueOf("#22aa44"));
    expect(hueOf("#22aa44")).toBeLessThan(hueOf("#2244cc"));
    expect(hueOf("#808080")).toBe(0);
  });
});

describe("decor", () => {
  const facts = {
    booksRead: 23,
    readThisYear: 9,
    goal: null,
    genresRead: 5,
    longestStreak: 3,
    reviews: 0,
    groups: 1,
  };

  it("counts what each object earns", () => {
    const progress = decorProgress(facts);
    expect(progress.candle).toMatchObject({ level: 0, done: 9, target: 12 });
    expect(progress.plant).toMatchObject({ level: 2, done: 3, target: 10 });
    expect(decorLevelsOf(facts)).toEqual({
      plant: 2,
      candle: 0,
      frame: 1,
      mug: 0,
      star: 0,
      globe: 1,
    });
    expect(decorProgress({ ...facts, goal: 8 }).candle.level).toBe(1);
    expect(decorProgress({ ...facts, booksRead: 80 }).plant).toMatchObject({ level: 3, done: 10 });
  });

  it("finds the longest run of days", () => {
    expect(longestStreak([])).toBe(0);
    expect(
      longestStreak(["2026-03-01", "2026-03-02", "2026-03-05", "2026-03-06", "2026-03-07"]),
    ).toBe(3);
    expect(longestStreak(["2026-02-28", "2026-03-01", "2026-03-01"])).toBe(2);
  });

  it("knows a book just read and how far into one", () => {
    const now = Date.UTC(2026, 10, 15);
    expect(isJustRead(now - 2 * 86_400_000, now)).toBe(true);
    expect(isJustRead(now - 8 * 86_400_000, now)).toBe(false);
    expect(isJustRead(null, now)).toBe(false);
    expect(readingProgress(50, 200)).toBe(0.25);
    expect(readingProgress(50, null)).toBe(0);
  });
});
