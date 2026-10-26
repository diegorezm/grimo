import { describe, expect, it } from "vitest";
import { planShelfTransition } from "./transition";

const now = new Date("2026-10-18T12:00:00Z");
const fresh = { status: null, currentPage: 0, startedAt: null };

describe("planShelfTransition", () => {
  it("starts the reading date when moving to 'reading'", () => {
    const result = planShelfTransition(fresh, { status: "reading" }, 300, now);
    expect(result.set.startedAt).toEqual(now);
    expect(result.activity).toBe("shelved");
    expect(result.pagesRead).toBe(0);
  });

  it("finishing fills the remaining pages and emits 'finished'", () => {
    const prev = { status: "reading" as const, currentPage: 100, startedAt: now };
    const result = planShelfTransition(prev, { status: "read" }, 300, now);
    expect(result.set).toMatchObject({ finishedAt: now, currentPage: 300 });
    expect(result.pagesRead).toBe(200);
    expect(result.activity).toBe("finished");
  });

  it("progress updates emit 'progress' only when pages advance", () => {
    const prev = { status: "reading" as const, currentPage: 50, startedAt: now };
    expect(planShelfTransition(prev, { currentPage: 80 }, 300, now)).toMatchObject({
      pagesRead: 30,
      activity: "progress",
    });
    expect(planShelfTransition(prev, { currentPage: 40 }, 300, now).activity).toBeNull();
  });
});

describe("planShelfTransition page limits", () => {
  const prev = { status: "reading" as const, currentPage: 50, startedAt: now };

  it("never goes past the book's last page", () => {
    const result = planShelfTransition(prev, { currentPage: 9999 }, 300, now);
    expect(result.set.currentPage).toBe(300);
    expect(result.pagesRead).toBe(250);
  });

  it("caps books with an unknown length", () => {
    expect(planShelfTransition(prev, { currentPage: 19999 }, null, now).set.currentPage).toBe(
      19999,
    );
  });
});
