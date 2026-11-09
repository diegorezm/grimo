import { describe, expect, it } from "vitest";
import {
  cardFeelings,
  type Feeling,
  feelingsSchema,
  formatRating,
  MAX_FEELINGS,
  nextRating,
  ratingSchema,
  starBucket,
  starFills,
  starShares,
  suggestFeelings,
  toggleFeeling,
  topFeelings,
} from ".";

describe("ratings", () => {
  it("go in halves from ½ to 5", () => {
    for (const rating of [0.5, 1, 3.5, 5])
      expect(ratingSchema.safeParse(rating).success).toBe(true);
    for (const rating of [0, 4.2, 5.5, -1])
      expect(ratingSchema.safeParse(rating).success).toBe(false);
    expect(formatRating(4.5)).toBe("4,5");
    expect(formatRating(4)).toBe("4");
  });

  it("draw whole and half stars", () => {
    expect(starFills(3.5)).toEqual(["full", "full", "full", "half", "empty"]);
    expect(starFills(null)).toEqual(Array(5).fill("empty"));
    expect(starFills(0.5)[0]).toBe("half");
  });

  it("clear when the current rating is tapped again", () => {
    expect(nextRating(null, 4)).toBe(4);
    expect(nextRating(3.5, 4)).toBe(4);
    expect(nextRating(4, 3.5)).toBe(3.5);
    expect(nextRating(4, 4)).toBeNull();
  });

  it("count half stars in the bar below and share the bars", () => {
    expect([0.5, 1, 4.5, 5].map(starBucket)).toEqual([0, 0, 3, 4]);
    expect(starShares([1, 0, 0, 1, 2])).toEqual([
      { star: 5, count: 2, percent: 50 },
      { star: 4, count: 1, percent: 25 },
      { star: 3, count: 0, percent: 0 },
      { star: 2, count: 0, percent: 0 },
      { star: 1, count: 1, percent: 25 },
    ]);
    expect(starShares([0, 0, 0, 0, 0]).every((bar) => bar.percent === 0)).toBe(true);
  });
});

describe("feelings", () => {
  it("are a few known ones, without repeats", () => {
    expect(feelingsSchema.parse(["tensao", "tensao", "medo"])).toEqual(["tensao", "medo"]);
    expect(feelingsSchema.safeParse(["saudade"]).success).toBe(false);
    expect(
      feelingsSchema.safeParse([
        "alegria",
        "medo",
        "raiva",
        "tedio",
        "tensao",
        "surpresa",
        "paixao",
        "conforto",
      ]).error?.issues[0]?.message,
    ).toMatch(/até 7/);
  });

  it("toggle up to the limit", () => {
    expect(toggleFeeling([], "medo")).toEqual(["medo"]);
    expect(toggleFeeling(["medo", "raiva"], "medo")).toEqual(["raiva"]);
    const full = ["alegria", "medo", "raiva", "tensao", "surpresa", "paixao"].reduce(
      (picked, feeling) => toggleFeeling(picked, feeling as Feeling),
      ["conforto"] as Feeling[],
    );
    expect(full).toHaveLength(MAX_FEELINGS);
    expect(toggleFeeling(full, "tedio")).toEqual(full);
  });

  it("suggests what was felt most along the way, the latest winning ties", () => {
    const marks = [["curiosidade"], ["tensao", "medo"], ["tensao"], ["tristeza"], ["medo"]];
    expect(suggestFeelings(marks)).toEqual(["medo", "tensao", "tristeza"]);
    expect(suggestFeelings([["saudade"], []])).toEqual([]);
  });

  it("on a feed card are the page's, else the rating's", () => {
    expect(cardFeelings({ page: 10, feelings: ["medo", "saudade"] }, ["alegria"])).toEqual([
      "medo",
    ]);
    expect(cardFeelings({ status: "read" }, ["alegria"])).toEqual(["alegria"]);
    expect(cardFeelings(null)).toEqual([]);
  });

  it("add up as a share of the readers who said how they felt", () => {
    expect(topFeelings({ tensao: 6, medo: 3, saudade: 9, alegria: 0 }, 10)).toEqual([
      { feeling: "tensao", label: "Tensão", count: 6, percent: 60 },
      { feeling: "medo", label: "Medo", count: 3, percent: 30 },
    ]);
    expect(topFeelings({ tensao: 1 }, 0)).toEqual([]);
  });
});
