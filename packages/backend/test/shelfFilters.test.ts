import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../convex/_generated/api";
import { onAccountDeleted } from "../convex/account";
import { newTest, reader } from "./setup";

const book = (n: number, genres: string[]) => ({
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

async function shelve(who: Reader, n: number, genres: string[], status: "read" | "want_to_read") {
  return (await who.as.mutation(api.shelves.add, { book: book(n, genres), status })).entry.id;
}

describe("tags and saved shelves", () => {
  it("tags books in one go and shows a saved shelf that keeps up by itself", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    const romance = await shelve(rafa, 1, ["romance"], "read");
    const fantasy = await shelve(rafa, 2, ["fantasy"], "read");
    const wanted = await shelve(rafa, 3, ["romance"], "want_to_read");

    const { id: tenho } = await rafa.as.mutation(api.shelfFilters.createTag, { name: "Tenho" });
    await expect(rafa.as.mutation(api.shelfFilters.createTag, { name: " tenho " })).rejects.toThrow(
      /já tem/,
    );
    await rafa.as.mutation(api.shelfFilters.setTag, {
      tagId: tenho,
      entryIds: [romance, fantasy, wanted],
      on: true,
    });
    const tagged = (await rafa.as.query(api.shelves.list, {})).items.filter((item) =>
      item.entry.tagIds.includes(tenho),
    );
    expect(tagged).toHaveLength(3);

    await rafa.as.mutation(api.shelfFilters.saveShelf, {
      name: "Romances que tenho",
      filter: { statuses: [], genres: ["romance"], tagIds: [tenho] },
      isPublic: true,
    });
    await rafa.as.mutation(api.shelfFilters.saveShelf, {
      name: "Secreta",
      filter: { statuses: [], genres: [], tagIds: [tenho] },
      isPublic: false,
    });

    // The owner sees both shelves and the "Quero ler" book; others, only what's public.
    const mine = (await rafa.as.query(api.shelfFilters.profileShelves, { username: "rafa" })).items;
    expect(mine.map((shelf) => [shelf.name, shelf.count])).toEqual([
      ["Romances que tenho", 2],
      ["Secreta", 3],
    ]);
    const theirs = (await bia.as.query(api.shelfFilters.profileShelves, { username: "rafa" }))
      .items;
    expect(theirs.map((shelf) => [shelf.name, shelf.count])).toEqual([["Romances que tenho", 1]]);

    // A new romance tagged Tenho shows up without touching the shelf.
    const another = await shelve(rafa, 4, ["romance"], "read");
    await rafa.as.mutation(api.shelfFilters.setTag, {
      tagId: tenho,
      entryIds: [another],
      on: true,
    });
    const after = (await bia.as.query(api.shelfFilters.profileShelves, { username: "rafa" })).items;
    expect(after[0]?.count).toBe(2);

    // Deleting the tag takes it off the books and out of the shelves' filters.
    await rafa.as.mutation(api.shelfFilters.removeTag, { id: tenho });
    const saved = (await rafa.as.query(api.shelfFilters.savedShelves, {})).items;
    expect(saved[0]?.filter.tagIds).toEqual([]);
    expect(
      (await rafa.as.query(api.shelves.list, {})).items.every((i) => i.entry.tagIds.length === 0),
    ).toBe(true);
  });

  it("refuses someone else's tag or book, and a shelf without filters", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    const entry = await shelve(bia, 1, [], "read");
    const { id: tag } = await bia.as.mutation(api.shelfFilters.createTag, { name: "Tenho" });
    const { id: mine } = await rafa.as.mutation(api.shelfFilters.createTag, { name: "Tenho" });

    await expect(
      rafa.as.mutation(api.shelfFilters.setTag, { tagId: tag, entryIds: [], on: true }),
    ).rejects.toThrow(/Marcador/);
    await expect(
      rafa.as.mutation(api.shelfFilters.setTag, { tagId: mine, entryIds: [entry], on: true }),
    ).rejects.toThrow(/Livro/);
    await expect(
      rafa.as.mutation(api.shelfFilters.saveShelf, {
        name: "Vazia",
        filter: { statuses: [], genres: [], tagIds: [] },
        isPublic: true,
      }),
    ).rejects.toThrow(/filtro/);
  });

  it("go in the data export and leave with the account", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const entry = await shelve(rafa, 1, ["romance"], "read");
    const { id: tag } = await rafa.as.mutation(api.shelfFilters.createTag, { name: "Kindle" });
    await rafa.as.mutation(api.shelfFilters.setTag, { tagId: tag, entryIds: [entry], on: true });
    await rafa.as.mutation(api.shelfFilters.saveShelf, {
      name: "Digitais",
      filter: { statuses: [], genres: [], tagIds: [tag] },
      isPublic: false,
    });

    const data = await t
      .withIdentity({ subject: "auth-rafa", email: "rafa@grimo.test" })
      .query(api.account.exportData, {});
    expect(data.shelfTags).toEqual(["Kindle"]);
    expect(data.savedShelves).toMatchObject([{ name: "Digitais", tags: ["Kindle"] }]);
    expect(data.shelf[0]).toMatchObject({ tags: ["Kindle"] });

    await t.run((ctx) => onAccountDeleted(ctx, "auth-rafa"));
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    const left = await t.run(async (ctx) => ({
      tags: await ctx.db.query("shelfTags").collect(),
      shelves: await ctx.db.query("savedShelves").collect(),
    }));
    expect(left).toEqual({ tags: [], shelves: [] });
  });
});
