import type { ImportedBook } from "@grimo/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../convex/_generated/api";
import { newTest, reader } from "./setup";

/** What the stubbed Open Library search knows, by query. */
const LIBRARY: Record<string, object> = {
  "isbn:9788551006751": {
    key: "/works/OL1W",
    title: "Torto Arado",
    author_name: ["Itamar Vieira Junior"],
    number_of_pages_median: 260,
  },
  "Duna Frank Herbert": { key: "/works/OL2W", title: "Duna", author_name: ["Frank Herbert"] },
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: URL) => {
      const doc = LIBRARY[url.searchParams.get("q") ?? ""];
      return new Response(JSON.stringify({ docs: doc ? [doc] : [] }));
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const book = (overrides: Partial<ImportedBook>): ImportedBook => ({
  title: "x",
  authors: [],
  isbn13: null,
  isbn10: null,
  status: "want_to_read",
  rating: null,
  finishedAt: null,
  pageCount: null,
  ...overrides,
});

describe("imports", () => {
  it("finds the books, shelves them quietly and reports what it couldn't find", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    await bia.as.mutation(api.users.setFollowing, { userId: rafa.id, follow: true });
    const finishedAt = Date.UTC(2023, 4, 14, 12);

    await rafa.as.mutation(api.imports.start, {
      books: [
        book({
          title: "Torto Arado",
          isbn13: "9788551006751",
          status: "read",
          rating: 5,
          finishedAt,
          pageCount: 264,
        }),
        book({ title: "Duna", authors: ["Frank Herbert"], status: "reading" }),
        book({ title: "Livro que não existe", authors: ["Ninguém"] }),
      ],
    });
    expect(await rafa.as.query(api.imports.latest, {})).toMatchObject({ status: "running" });
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    expect(await rafa.as.query(api.imports.latest, {})).toMatchObject({
      status: "done",
      total: 3,
      processed: 3,
      added: 2,
      notFound: ["Livro que não existe"],
    });
    const { items } = await rafa.as.query(api.shelves.list, {});
    const torto = items.find((item) => item.book.title === "Torto Arado");
    // Their edition's 264 pages, finished on the day Goodreads says.
    expect(torto).toMatchObject({
      entry: { status: "read", rating: 5, finishedAt, pageCount: 264, currentPage: 264 },
      book: { pageCount: 264 },
    });
    // Quiet: nothing in the feed of whoever follows, no pages counted for this month.
    const feed = (await bia.as.query(api.feed.list, { limit: 20 })).items;
    expect(feed.filter((item) => item.actor.username === "rafa")).toEqual([]);
    expect(await t.run((ctx) => ctx.db.query("readingLogs").collect())).toEqual([]);
    expect(await t.run((ctx) => ctx.db.query("importRows").collect())).toEqual([]);

    // Importing again leaves the shelf as it is; one import at a time.
    await rafa.as.mutation(api.imports.start, {
      books: [book({ title: "Torto Arado", isbn13: "9788551006751", status: "want_to_read" })],
    });
    await expect(
      rafa.as.mutation(api.imports.start, { books: [book({ title: "Duna" })] }),
    ).rejects.toThrow(/em andamento/);
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(await rafa.as.query(api.imports.latest, {})).toMatchObject({ added: 0, skipped: 1 });
    const again = (await rafa.as.query(api.shelves.list, {})).items;
    expect(again.find((item) => item.book.title === "Torto Arado")?.entry.status).toBe("read");

    const data = await rafa.as.query(api.account.exportData, {});
    expect(data.imports).toHaveLength(2);
  });

  it("refuses an empty file", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    await expect(rafa.as.mutation(api.imports.start, { books: [] })).rejects.toThrow(/não tem/);
  });
});
