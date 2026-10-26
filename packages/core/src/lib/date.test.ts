import { describe, expect, it } from "vitest";
import {
  isValidTimeZone,
  monthRange,
  percentChange,
  shiftMonth,
  toMonthKey,
  yearRange,
} from "./date";

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

describe("time zones", () => {
  const sp = "America/Sao_Paulo";

  it("a book finished at 22h on Oct 31 in São Paulo is still October", () => {
    const finished = new Date("2026-11-01T01:00:00Z"); // 22:00 on 31/10 in UTC-3
    expect(toMonthKey(finished, sp)).toBe("2026-10");
    expect(toMonthKey(finished, "UTC")).toBe("2026-11");
    const october = monthRange("2026-10", sp);
    expect(finished >= october.start && finished < october.end).toBe(true);
  });

  it("month and year ranges start at local midnight", () => {
    expect(monthRange("2026-10", sp).start.toISOString()).toBe("2026-10-01T03:00:00.000Z");
    expect(monthRange("2026-12", sp).end.toISOString()).toBe("2027-01-01T03:00:00.000Z");
    expect(yearRange(2026, sp).start.toISOString()).toBe("2026-01-01T03:00:00.000Z");
    expect(yearRange(2026).start.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });

  it("follows daylight saving time", () => {
    // New York is UTC-4 on Oct 1 and UTC-5 on Nov 1 (DST ended Nov 1, 2026).
    expect(monthRange("2026-10", "America/New_York").start.toISOString()).toBe(
      "2026-10-01T04:00:00.000Z",
    );
    expect(monthRange("2026-11", "America/New_York").start.toISOString()).toBe(
      "2026-11-01T04:00:00.000Z",
    );
    expect(monthRange("2026-11", "America/New_York").end.toISOString()).toBe(
      "2026-12-01T05:00:00.000Z",
    );
  });

  it("knows valid zones", () => {
    expect(isValidTimeZone("America/Sao_Paulo")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
  });
});
