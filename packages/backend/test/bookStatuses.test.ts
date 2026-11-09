import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../convex/_generated/api";
import { newTest, reader } from "./setup";

const book = {
  openLibraryId: "OL2W",
  title: "Torto Arado",
  authors: ["Itamar Vieira Junior"],
  coverUrl: null,
  pageCount: 264,
  publishedYear: 2019,
  genres: [],
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-08T12:00:00Z"));
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ docs: [] }))),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("book page: readers per status", () => {
  it("counts who read, is reading, wants to and stopped, and follows changes", async () => {
    const t = newTest();
    const ana = await reader(t, "ana");
    const leo = await reader(t, "leo");
    const bia = await reader(t, "bia");

    await ana.as.mutation(api.shelves.add, { book, status: "read" });
    const { entry } = await leo.as.mutation(api.shelves.add, { book, status: "reading" });
    await bia.as.mutation(api.shelves.add, { book, status: "want_to_read" });

    const statuses = async () =>
      (await ana.as.query(api.books.detail, { openLibraryId: book.openLibraryId })).detail!
        .community.statuses;

    expect(await statuses()).toEqual({ read: 1, reading: 1, want_to_read: 1, abandoned: 0 });

    await leo.as.mutation(api.shelves.update, { id: entry.id, status: "abandoned" });
    expect(await statuses()).toEqual({ read: 1, reading: 0, want_to_read: 1, abandoned: 1 });

    await leo.as.mutation(api.shelves.remove, { id: entry.id });
    expect(await statuses()).toEqual({ read: 1, reading: 0, want_to_read: 1, abandoned: 0 });
  });
});
