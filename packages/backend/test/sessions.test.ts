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
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

beforeEach(() => {
  vi.useFakeTimers();
  // Noon in São Paulo, so "today" doesn't flip in the middle of the test.
  vi.setSystemTime(new Date("2026-10-30T15:00:00Z"));
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ docs: [] }))),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("reading sessions", () => {
  it("times the reading and tells the feed how long it took", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const { entry } = await rafa.as.mutation(api.shelves.add, { book, status: "reading" });
    expect(await rafa.as.query(api.sessions.active, {})).toBeNull();

    await rafa.as.mutation(api.sessions.start, { entryId: entry.id });
    const active = await rafa.as.query(api.sessions.active, {});
    expect(active).toMatchObject({ entryId: entry.id, startPage: 0, book: { title: "Duna" } });

    vi.advanceTimersByTime(35 * MINUTE);
    expect(await rafa.as.mutation(api.sessions.finish, { page: 40 })).toEqual({
      minutes: 35,
      pagesRead: 40,
    });
    expect(await rafa.as.query(api.sessions.active, {})).toBeNull();
    const [progress] = (await rafa.as.query(api.feed.list, { limit: 20 })).items;
    expect(progress).toMatchObject({
      kind: "progress",
      data: { page: 40, minutes: 35, pagesRead: 40 },
    });
    const { items } = await rafa.as.query(api.shelves.list, {});
    expect(items[0]?.entry.currentPage).toBe(40);

    const data = await rafa.as.query(api.account.exportData, {});
    expect(data.readingSessions).toMatchObject([{ book: "Duna", startPage: 0, endPage: 40 }]);
  });

  it("only runs on a book being read, and can be thrown away", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const { entry } = await rafa.as.mutation(api.shelves.add, { book, status: "want_to_read" });
    await expect(rafa.as.mutation(api.sessions.start, { entryId: entry.id })).rejects.toThrow(
      /Lendo/,
    );
    await rafa.as.mutation(api.shelves.update, { id: entry.id, status: "reading" });
    await rafa.as.mutation(api.sessions.start, { entryId: entry.id });
    await rafa.as.mutation(api.sessions.discard, {});
    expect(await rafa.as.query(api.sessions.active, {})).toBeNull();
    await expect(rafa.as.mutation(api.sessions.finish, { page: 10 })).rejects.toThrow(/Sessão/);
  });

  it("counts the streak in days in a row", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const { entry } = await rafa.as.mutation(api.shelves.add, { book, status: "reading" });
    expect(await rafa.as.query(api.sessions.streak, {})).toEqual({ days: 0, readToday: false });

    // Three days in a row, then a gap, then today.
    vi.setSystemTime(new Date("2026-10-25T15:00:00Z"));
    for (const page of [10, 20, 30]) {
      await rafa.as.mutation(api.shelves.update, { id: entry.id, currentPage: page });
      vi.advanceTimersByTime(DAY);
    }
    vi.setSystemTime(new Date("2026-10-29T15:00:00Z"));
    await rafa.as.mutation(api.shelves.update, { id: entry.id, currentPage: 40 });
    vi.setSystemTime(new Date("2026-10-30T15:00:00Z"));
    expect(await rafa.as.query(api.sessions.streak, {})).toEqual({ days: 1, readToday: false });

    // A timed session with no new page still counts the day.
    await rafa.as.mutation(api.sessions.start, { entryId: entry.id });
    vi.advanceTimersByTime(10 * MINUTE);
    await rafa.as.mutation(api.sessions.finish, { page: 40 });
    expect(await rafa.as.query(api.sessions.streak, {})).toEqual({ days: 2, readToday: true });
  });
});
