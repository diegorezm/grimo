import type { ShelfStyle } from "@grimo/core";
import jpeg from "jpeg-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "../convex/_generated/api";
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
    expect(data.myShelves).toEqual([
      { name: "Kindle", isPublic: false, style: null, arrangedBooks: 0 },
    ]);
    expect(data.shelf[0]).toMatchObject({ shelves: ["Kindle"] });

    await t.run((ctx) => onAccountDeleted(ctx, "auth-rafa"));
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(await t.run((ctx) => ctx.db.query("shelfTags").collect())).toEqual([]);
  });
});

describe("a whole shelf from the profile", () => {
  it("opens Lidos, Lendo or a public shelf, and hides private ones and Quero ler from others", async () => {
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
    const { id: secreta } = await rafa.as.mutation(api.bookshelves.create, {
      name: "Secreta",
      isPublic: false,
      entryIds: [read],
    });

    const lidos = await bia.as.query(api.bookshelves.profileShelf, {
      username: "rafa",
      shelf: "read",
    });
    expect(lidos).toMatchObject({ name: "Lidos", count: 1 });
    const theirs = await bia.as.query(api.bookshelves.profileShelf, {
      username: "rafa",
      shelf: fisica,
    });
    expect(theirs.count).toBe(1);
    const mine = await rafa.as.query(api.bookshelves.profileShelf, {
      username: "rafa",
      shelf: fisica,
    });
    expect(mine.count).toBe(2);
    await expect(
      bia.as.query(api.bookshelves.profileShelf, { username: "rafa", shelf: secreta }),
    ).rejects.toThrow(/Estante/);
  });
});

describe("how a shelf looks", () => {
  const acervo: ShelfStyle = {
    model: "library",
    material: "walnut",
    finish: "leather",
    layout: "standing",
    sort: "height",
    decor: ["candle", "globe"],
    light: "lamp",
  };

  it("starts with the default and keeps each shelf's own style", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const { id } = await rafa.as.mutation(api.bookshelves.create, {
      name: "Física",
      isPublic: true,
    });
    const before = await rafa.as.query(api.bookshelves.mine, {});
    expect(before.items[0]?.style.model).toBe("classic");
    expect(before.all.style.model).toBe("classic");

    await rafa.as.mutation(api.bookshelves.setStyle, { id, style: acervo });
    await rafa.as.mutation(api.bookshelves.setStyle, { style: { ...acervo, model: "arch" } });
    const after = await rafa.as.query(api.bookshelves.mine, {});
    expect(after.items[0]?.style).toEqual(acervo);
    expect(after.all.style.model).toBe("arch");

    const { id: copy } = await rafa.as.mutation(api.bookshelves.duplicate, { id });
    const shelves = (await rafa.as.query(api.bookshelves.mine, {})).items;
    expect(shelves.find((shelf) => shelf.id === copy)?.style).toEqual(acervo);

    const profile = await rafa.as.query(api.bookshelves.profile, { username: "rafa" });
    expect(profile.items[0]?.style).toEqual(acervo);
  });

  it("a new shelf can start with a style; nobody styles someone else's shelf", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    const { id } = await rafa.as.mutation(api.bookshelves.create, {
      name: "Kindle",
      isPublic: false,
      style: acervo,
    });
    expect((await rafa.as.query(api.bookshelves.mine, {})).items[0]?.style).toEqual(acervo);
    await expect(bia.as.mutation(api.bookshelves.setStyle, { id, style: acervo })).rejects.toThrow(
      /Estante/,
    );
    await expect(
      rafa.as.mutation(api.bookshelves.setStyle, {
        id,
        style: { ...acervo, decor: ["candle", "candle"] },
      }),
    ).rejects.toThrow(/repetido/);
  });

  it("keeps the reader's own order of a shelf, without anyone else's books", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    const [a, b, c] = [await shelve(rafa, 1), await shelve(rafa, 2), await shelve(rafa, 3)];
    const stranger = await shelve(bia, 4);
    const { id } = await rafa.as.mutation(api.bookshelves.create, {
      name: "Física",
      isPublic: true,
      entryIds: [a, b, c],
    });

    await rafa.as.mutation(api.bookshelves.setOrder, { id, entryIds: [c, a, stranger, c, b] });
    await rafa.as.mutation(api.bookshelves.setOrder, { entryIds: [b, a] });
    const mine = await rafa.as.query(api.bookshelves.mine, {});
    expect(mine.items[0]?.order).toEqual([c, a, b]);
    expect(mine.all.order).toEqual([b, a]);
    expect(
      (await t.query(api.bookshelves.profileShelf, { username: "rafa", shelf: id })).order,
    ).toEqual([c, a, b]);

    const { id: copy } = await rafa.as.mutation(api.bookshelves.duplicate, { id });
    const shelves = (await rafa.as.query(api.bookshelves.mine, {})).items;
    expect(shelves.find((shelf) => shelf.id === copy)?.order).toEqual([c, a, b]);
    await expect(bia.as.mutation(api.bookshelves.setOrder, { id, entryIds: [] })).rejects.toThrow(
      /Estante/,
    );
  });

  it("counts what the objects earn: the plant grows, the candle waits for the goal", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    for (let n = 1; n <= 12; n++) {
      await rafa.as.mutation(api.shelves.add, {
        book: book(n, [n % 2 === 0 ? "romance" : "fantasia"]),
        status: n === 12 ? "want_to_read" : "read",
      });
    }
    const { progress } = await rafa.as.query(api.bookshelves.decor, {});
    expect(progress.plant).toMatchObject({ level: 1, done: 1, target: 10 });
    expect(progress.candle).toMatchObject({ level: 0, done: 11, target: 12 });
    expect(progress.globe).toMatchObject({ level: 0, done: 2, target: 5 });
    expect(progress.star.level).toBe(0);

    await rafa.as.mutation(api.shelves.add, { book: book(13), status: "read" });
    expect((await rafa.as.query(api.bookshelves.decor, {})).progress.candle.level).toBe(1);
    const shelf = await rafa.as.query(api.bookshelves.profileShelf, {
      username: "rafa",
      shelf: "read",
    });
    expect(shelf.decorLevels).toMatchObject({ candle: 1, plant: 1, star: 0 });
  });

  it("paints each spine in the colors of its cover, once", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    await rafa.as.mutation(api.shelves.add, {
      book: { ...book(1), coverUrl: "https://covers.openlibrary.org/b/id/1-M.jpg" },
      status: "read",
    });
    await shelve(rafa, 2);
    // A cover that is mostly dark blue.
    const data = new Uint8Array(16 * 16 * 4);
    for (let i = 0; i < data.length; i += 4) data.set([20, 40, 120, 255], i);
    const cover = jpeg.encode({ data, width: 16, height: 16 }, 90).data;
    const fetched = vi.fn(async () => new Response(new Uint8Array(cover)));
    vi.stubGlobal("fetch", fetched);

    await t.action(internal.books.paintSpines, {});
    const spines = async () =>
      Object.fromEntries(
        (await rafa.as.query(api.shelves.list, {})).items.map((row) => [row.book.title, row.spine]),
      );
    const painted = await spines();
    expect(painted["Livro 2"]).toBeNull();
    expect(painted["Livro 1"]?.ink).toBe("#fff7ec");
    expect(painted["Livro 1"]?.base).toMatch(/^#1[0-9a-f]2[0-9a-f]7[0-9a-f]$/);

    // Both were looked at: nothing left to paint, no cover fetched again.
    fetched.mockClear();
    await t.action(internal.books.paintSpines, {});
    expect(fetched).not.toHaveBeenCalled();
  });
});
