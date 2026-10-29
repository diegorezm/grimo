import { describe, expect, it } from "vitest";
import { editionPages, planShelfTransition } from "./transition";

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

describe("planShelfTransition furthest page", () => {
  const reading = { status: "reading" as const, startedAt: now };

  it("counts only pages beyond the furthest one already logged", () => {
    // Went to 200, back to 100 (maxPage kept at 200), now forward to 150: nothing new.
    const back = { ...reading, currentPage: 100, maxPage: 200 };
    const same = planShelfTransition(back, { currentPage: 150 }, 300, now);
    expect(same.pagesRead).toBe(0);
    expect(same.activity).toBeNull();
    expect(same.maxPage).toBe(200);
    // Past the old furthest page: only the new pages count.
    const beyond = planShelfTransition(back, { currentPage: 230 }, 300, now);
    expect(beyond.pagesRead).toBe(30);
    expect(beyond.maxPage).toBe(230);
  });

  it("entries without maxPage fall back to the current page", () => {
    const old = { ...reading, currentPage: 80 };
    expect(planShelfTransition(old, { currentPage: 100 }, 300, now)).toMatchObject({
      pagesRead: 20,
      maxPage: 100,
    });
  });
});

describe("edition pages", () => {
  it("uses the reader's edition when set", () => {
    expect(editionPages(412, 300)).toBe(412);
    expect(editionPages(null, 300)).toBe(300);
    expect(editionPages(undefined, null)).toBeNull();
  });

  it("moves the bookmark to the last page of a shorter edition, without reading pages", () => {
    const prev = { status: "reading" as const, currentPage: 280, startedAt: now };
    const result = planShelfTransition(prev, { pageCount: 250 }, 250, now);
    expect(result.set.currentPage).toBe(250);
    expect(result).toMatchObject({ pagesRead: 0, activity: null });
  });

  it("finishing fills up to the edition's last page", () => {
    const prev = { status: "reading" as const, currentPage: 100, startedAt: now };
    expect(planShelfTransition(prev, { status: "read" }, 412, now).set.currentPage).toBe(412);
  });
});
