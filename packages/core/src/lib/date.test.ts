import { describe, expect, it } from "vitest";
import { percentChange, shiftMonth } from "./date";

describe("shiftMonth", () => {
  it("crosses year boundaries both ways", () => {
    expect(shiftMonth("2026-10", -1)).toBe("2026-09");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });
});

describe("percentChange", () => {
  it("rounds, and has no baseline at zero", () => {
    expect(percentChange(12, 10)).toBe(20);
    expect(percentChange(6, 8)).toBe(-25);
    expect(percentChange(3, 0)).toBeNull();
  });
});
