import { describe, expect, it } from "vitest";
import { shiftDay, toDayKey } from "../lib/date";
import { formatMinutes, formatTimer, readingStreak, sessionMinutes, streakLabel } from "./index";

describe("reading sessions", () => {
  it("formats the timer and the duration", () => {
    expect(formatTimer(42_000)).toBe("0:42");
    expect(formatTimer(725_000)).toBe("12:05");
    expect(formatTimer(3_725_000)).toBe("1:02:05");
    expect(formatMinutes(35)).toBe("35 min");
    expect(formatMinutes(60)).toBe("1 h");
    expect(formatMinutes(80)).toBe("1 h 20 min");
  });

  it("caps a session left open", () => {
    expect(sessionMinutes(0, 30 * 60_000)).toBe(30);
    expect(sessionMinutes(0, 20 * 60 * 60_000)).toBe(6 * 60);
    expect(sessionMinutes(0, 5_000)).toBe(1);
  });
});

describe("readingStreak", () => {
  it("counts days in a row up to today, or yesterday while today is open", () => {
    const today = "2026-10-30";
    expect(readingStreak(["2026-10-30", "2026-10-29", "2026-10-28", "2026-10-26"], today)).toEqual({
      days: 3,
      readToday: true,
    });
    expect(readingStreak(["2026-10-29", "2026-10-28"], today)).toEqual({
      days: 2,
      readToday: false,
    });
    expect(readingStreak(["2026-10-27"], today)).toEqual({ days: 0, readToday: false });
    expect(streakLabel(1)).toBe("1 dia seguido");
  });

  it("walks across months and uses the reader's time zone", () => {
    expect(shiftDay("2026-03-01", -1)).toBe("2026-02-28");
    // 01:30 UTC on Oct 30 is still Oct 29 in São Paulo.
    expect(toDayKey(new Date("2026-10-30T01:30:00Z"), "America/Sao_Paulo")).toBe("2026-10-29");
  });
});
