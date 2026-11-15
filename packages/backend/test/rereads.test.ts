import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../convex/_generated/api";
import { newTest, reader } from "./setup";

const book = {
  openLibraryId: "OL1W",
  title: "Duna",
  authors: ["Frank Herbert"],
  coverUrl: null,
  pageCount: 600,
  publishedYear: 1965,
  genres: [],
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-06-01T12:00:00Z"));
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ docs: [] }))),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("rereads", () => {
  it("keep the first reading in its year and count the reread in the next", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const { entry } = await rafa.as.mutation(api.shelves.add, { book, status: "reading" });
    await rafa.as.mutation(api.shelves.update, { id: entry.id, status: "read", rating: 4 });

    vi.setSystemTime(new Date("2026-03-01T12:00:00Z"));
    const reread = await rafa.as.mutation(api.shelves.update, { id: entry.id, status: "reading" });
    expect(reread.entry).toMatchObject({
      currentPage: 0,
      finishedAt: null,
      pastReads: 1,
      rating: 4,
    });
    expect((await rafa.as.query(api.stats.overview, { year: 2025 })).booksRead).toBe(1);

    await rafa.as.mutation(api.shelves.update, { id: entry.id, currentPage: 200 });
    await rafa.as.mutation(api.shelves.update, { id: entry.id, status: "read" });
    expect((await rafa.as.query(api.stats.overview, { year: 2025 })).booksRead).toBe(1);
    const year = await rafa.as.query(api.stats.overview, { year: 2026 });
    expect(year).toMatchObject({ booksRead: 1, pagesRead: 600 });

    const data = await rafa.as.action(api.account.exportData, {});
    expect(data.pastReadings).toEqual([
      expect.objectContaining({ book: "Duna", rating: 4, finishedAt: "2025-06-01T12:00:00.000Z" }),
    ]);

    await rafa.as.mutation(api.shelves.remove, { id: entry.id });
    expect((await rafa.as.query(api.stats.overview, { year: 2025 })).booksRead).toBe(0);
  });
});
