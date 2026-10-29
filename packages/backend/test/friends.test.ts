import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../convex/_generated/api";
import { newTest, reader } from "./setup";

const book = (id: number, pageCount: number | null = 300) => ({
  openLibraryId: `OL${id}W`,
  title: `Livro ${id}`,
  authors: ["Autora"],
  coverUrl: null,
  pageCount,
  publishedYear: 2020,
  genres: [],
});

beforeEach(() => {
  // `shelves.add` schedules `books.refreshBook`; with fake timers it never runs.
  vi.useFakeTimers();
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("edition pages", () => {
  it("counts progress against your edition, and goes back to the book's", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const { entry } = await rafa.as.mutation(api.shelves.add, {
      book: book(1),
      status: "reading",
    });

    await rafa.as.mutation(api.shelves.update, { id: entry.id, pageCount: 412 });
    await rafa.as.mutation(api.shelves.update, { id: entry.id, currentPage: 400 });
    let { items } = await rafa.as.query(api.shelves.list, {});
    expect(items[0]).toMatchObject({
      entry: { pageCount: 412, currentPage: 400 },
      book: { pageCount: 412 },
    });

    // Back to the book's 300 pages: the bookmark can't be past the end.
    await rafa.as.mutation(api.shelves.update, { id: entry.id, pageCount: null });
    ({ items } = await rafa.as.query(api.shelves.list, {}));
    expect(items[0]).toMatchObject({
      entry: { pageCount: null, currentPage: 300 },
      book: { pageCount: 300 },
    });

    const { detail } = await rafa.as.query(api.books.detail, { openLibraryId: "OL1W" });
    expect(detail?.book.pageCount).toBe(300);
  });

  it("finishes at your edition's last page and rejects nonsense", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const { entry } = await rafa.as.mutation(api.shelves.add, {
      book: book(1, null),
      status: "reading",
    });
    await expect(
      rafa.as.mutation(api.shelves.update, { id: entry.id, pageCount: 0 }),
    ).rejects.toThrow(/páginas/);
    await rafa.as.mutation(api.shelves.update, { id: entry.id, pageCount: 250 });
    const { entry: done } = await rafa.as.mutation(api.shelves.update, {
      id: entry.id,
      status: "read",
    });
    expect(done.currentPage).toBe(250);
  });
});

describe("friends want to read", () => {
  it("ranks the books the people you follow want, without the ones you've read", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    const caio = await reader(t, "caio");
    const ana = await reader(t, "ana");
    for (const friend of [bia, caio]) {
      await rafa.as.mutation(api.users.setFollowing, { userId: friend.id, follow: true });
    }

    await bia.as.mutation(api.shelves.add, { book: book(1), status: "want_to_read" });
    await caio.as.mutation(api.shelves.add, { book: book(1), status: "want_to_read" });
    await caio.as.mutation(api.shelves.add, { book: book(2), status: "want_to_read" });
    await bia.as.mutation(api.shelves.add, { book: book(3), status: "want_to_read" });
    await bia.as.mutation(api.shelves.add, { book: book(4), status: "reading" });
    // Not followed: doesn't count.
    await ana.as.mutation(api.shelves.add, { book: book(2), status: "want_to_read" });

    await rafa.as.mutation(api.shelves.add, { book: book(2), status: "want_to_read" });
    await rafa.as.mutation(api.shelves.add, { book: book(3), status: "read" });

    const { items } = await rafa.as.query(api.shelves.friendsWant, { limit: 10 });
    expect(
      items.map((item) => [item.book.openLibraryId, item.friends.length, item.youWant]),
    ).toEqual([
      ["OL1W", 2, false],
      ["OL2W", 1, true],
    ]);

    const { detail } = await rafa.as.query(api.books.detail, { openLibraryId: "OL1W" });
    expect(detail?.friendsWant.map((friend) => friend.username).sort()).toEqual(["bia", "caio"]);
  });
});
