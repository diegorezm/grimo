import { describe, expect, it } from "vitest";
import { groupByYearRead, yearRunLabel } from "./view";

describe("groupByYearRead", () => {
  it("groups books read by year, newest first, undated last", () => {
    const at = (date: string) => new Date(date).getTime();
    const books = [
      { id: "a", finishedAt: at("2025-03-01") },
      { id: "b", finishedAt: null },
      { id: "c", finishedAt: at("2026-01-10") },
      { id: "d", finishedAt: at("2025-11-20") },
    ];
    const groups = groupByYearRead(books, (date) => date.getUTCFullYear());
    expect(groups.map((g) => [g.year, g.items.map((i) => i.id)])).toEqual([
      [2026, ["c"]],
      [2025, ["d", "a"]],
      [null, ["b"]],
    ]);
  });

  it("labels each run", () => {
    expect(yearRunLabel(2026)).toBe("Lidos '26");
    expect(yearRunLabel(null)).toBe("Sem data");
  });
});

describe("compactCount", () => {
  it("shortens big counts the Brazilian way", async () => {
    const { compactCount } = await import("./view");
    expect(compactCount(950)).toBe("950");
    expect(compactCount(9400)).toBe("9,4 mil");
    expect(compactCount(12_480)).toBe("12 mil");
    expect(compactCount(1_250_000)).toBe("1,2 mi");
  });
});
