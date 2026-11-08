import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../convex/_generated/api";
import { onAccountDeleted } from "../convex/account";
import { newTest, reader } from "./setup";

const book = (n: number, genres: string[] = []) => ({
  openLibraryId: `OL${n}W`,
  title: `Livro ${n}`,
  authors: ["Autora"],
  coverUrl: null,
  pageCount: 300,
  publishedYear: 2020,
  genres,
});

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

type Reader = Awaited<ReturnType<typeof reader>>;

const shelve = async (who: Reader, n: number, status: "read" | "want_to_read" = "read") =>
  (await who.as.mutation(api.shelves.add, { book: book(n), status })).entry.id as string;

const counts = async (who: Reader) =>
  Object.fromEntries(
    (await who.as.query(api.bookshelves.mine, {})).items.map((shelf) => [shelf.name, shelf.count]),
  );

describe("shelves the reader makes", () => {
  it("are made with books, duplicated, trimmed, moved and deleted", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const [a, b, c] = [await shelve(rafa, 1), await shelve(rafa, 2), await shelve(rafa, 3)];

    const { id: fisica } = await rafa.as.mutation(api.bookshelves.create, {
      name: "Física",
      isPublic: true,
      entryIds: [a, b, c],
    });
    await expect(
      rafa.as.mutation(api.bookshelves.create, { name: " física ", isPublic: false }),
    ).rejects.toThrow(/já tem/);

    const { id: copia } = await rafa.as.mutation(api.bookshelves.duplicate, { id: fisica });
    await rafa.as.mutation(api.bookshelves.setBooks, { shelfId: copia, entryIds: [c], on: false });
    expect(await counts(rafa)).toEqual({ Física: 3, "Física (cópia)": 2 });

    const { id: kindle } = await rafa.as.mutation(api.bookshelves.create, {
      name: "Kindle",
      isPublic: false,
    });
    await rafa.as.mutation(api.bookshelves.move, { fromId: fisica, toId: kindle, entryIds: [a] });
    expect(await counts(rafa)).toEqual({ Física: 2, "Física (cópia)": 2, Kindle: 1 });

    // Deleting a shelf keeps the books in your readings.
    const removed = await rafa.as.mutation(api.bookshelves.remove, { id: copia });
    expect(removed.entryIds.sort()).toEqual([a, b].sort());
    expect((await rafa.as.query(api.shelves.list, {})).items).toHaveLength(3);
    expect(await counts(rafa)).toEqual({ Física: 2, Kindle: 1 });
  });

  it("show on the profile when public, without Quero ler for others", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    const read = await shelve(rafa, 1);
    const wanted = await shelve(rafa, 2, "want_to_read");
    const { id: fisica } = await rafa.as.mutation(api.bookshelves.create, {
      name: "Física",
      isPublic: true,
      entryIds: [read, wanted],
    });
    await rafa.as.mutation(api.bookshelves.create, {
      name: "Secreta",
      isPublic: false,
      entryIds: [read],
    });

    const theirs = (await bia.as.query(api.bookshelves.profile, { username: "rafa" })).items;
    expect(theirs.map((shelf) => [shelf.name, shelf.count])).toEqual([["Física", 1]]);
    const mine = (await rafa.as.query(api.bookshelves.profile, { username: "rafa" })).items;
    expect(mine.map((shelf) => [shelf.name, shelf.count])).toEqual([
      ["Física", 2],
      ["Secreta", 1],
    ]);

    await rafa.as.mutation(api.bookshelves.setPublic, { id: fisica, isPublic: false });
    expect((await bia.as.query(api.bookshelves.profile, { username: "rafa" })).items).toEqual([]);
  });

  it("refuse someone else's shelf or book", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    const theirBook = await shelve(bia, 1);
    const { id: theirShelf } = await bia.as.mutation(api.bookshelves.create, {
      name: "Dela",
      isPublic: true,
    });
    const { id: mine } = await rafa.as.mutation(api.bookshelves.create, {
      name: "Minha",
      isPublic: true,
    });
    await expect(
      rafa.as.mutation(api.bookshelves.setBooks, { shelfId: theirShelf, entryIds: [], on: true }),
    ).rejects.toThrow(/Estante/);
    await expect(
      rafa.as.mutation(api.bookshelves.setBooks, {
        shelfId: mine,
        entryIds: [theirBook],
        on: true,
      }),
    ).rejects.toThrow(/Livro/);
  });

  it("go in the data export and leave with the account", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const entry = await shelve(rafa, 1);
    await rafa.as.mutation(api.bookshelves.create, {
      name: "Kindle",
      isPublic: false,
      entryIds: [entry],
    });

    const data = await t
      .withIdentity({ subject: "auth-rafa", email: "rafa@grimo.test" })
      .query(api.account.exportData, {});
    expect(data.myShelves).toEqual([{ name: "Kindle", isPublic: false }]);
    expect(data.shelf[0]).toMatchObject({ shelves: ["Kindle"] });

    await t.run((ctx) => onAccountDeleted(ctx, "auth-rafa"));
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(await t.run((ctx) => ctx.db.query("shelfTags").collect())).toEqual([]);
  });
});
