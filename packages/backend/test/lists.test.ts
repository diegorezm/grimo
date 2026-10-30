import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "../convex/_generated/api";
import { newTest, reader } from "./setup";

const book = (id: string, title: string) => ({
  openLibraryId: id,
  title,
  authors: ["Autora"],
  coverUrl: null,
  pageCount: 300,
  publishedYear: 2020,
  genres: [],
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ docs: [] }))),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("lists", () => {
  it("are made by a reader and seen by everyone", async () => {
    const t = newTest();
    const bia = await reader(t, "bia");
    const rafa = await reader(t, "rafa");

    const { id } = await bia.as.mutation(api.lists.create, {
      title: "Terror para começar",
      description: "Do mais leve ao que tira o sono.",
    });
    await bia.as.mutation(api.lists.addBook, { listId: id, book: book("OL1W", "It") });
    await bia.as.mutation(api.lists.addBook, {
      listId: id,
      book: book("OL2W", "Carrie"),
      note: "Curto e certeiro",
    });
    // Adding again only updates the note.
    await bia.as.mutation(api.lists.addBook, {
      listId: id,
      book: book("OL1W", "It"),
      note: "Longo",
    });

    const list = await rafa.as.query(api.lists.get, { id });
    expect(list).toMatchObject({
      title: "Terror para começar",
      owner: { username: "bia" },
      isMine: false,
      items: [
        { note: "Longo", book: { title: "It" } },
        { note: "Curto e certeiro", book: { title: "Carrie" } },
      ],
    });
    const { items } = await rafa.as.query(api.lists.byUser, { username: "bia" });
    expect(items).toMatchObject([{ id, itemCount: 2, covers: [{ title: "It" }, {}] }]);

    const mine = await bia.as.query(api.lists.mine, { openLibraryId: "OL2W" });
    expect(mine.items).toMatchObject([{ id, hasBook: true }]);
    await bia.as.mutation(api.lists.removeBook, { listId: id, openLibraryId: "OL2W" });
    expect((await bia.as.query(api.lists.mine, { openLibraryId: "OL2W" })).items).toMatchObject([
      { itemCount: 1, hasBook: false },
    ]);

    // Only the owner changes it.
    await expect(rafa.as.mutation(api.lists.update, { id, title: "Minha agora" })).rejects.toThrow(
      /Lista/,
    );
    await expect(rafa.as.mutation(api.lists.create, { title: " " })).rejects.toThrow(/nome/);
  });

  it("go with blocks, moderation and the account", async () => {
    const t = newTest();
    const bia = await reader(t, "bia");
    const rafa = await reader(t, "rafa");
    const mod = await reader(t, "mod");
    await t.mutation(internal.moderation.setAdmin, { username: "mod", admin: true });
    const { id } = await bia.as.mutation(api.lists.create, { title: "Spam" });

    await rafa.as.mutation(api.moderation.setBlocked, { userId: bia.id, block: true });
    expect(await rafa.as.query(api.lists.get, { id })).toBeNull();
    expect((await rafa.as.query(api.lists.byUser, { username: "bia" })).items).toEqual([]);

    await mod.as.mutation(api.moderation.report, { target: "list", targetId: id, reason: "spam" });
    const { items: reports } = await mod.as.query(api.moderation.reports, {
      page: 1,
      pageSize: 20,
    });
    expect(reports[0]).toMatchObject({ target: "list", snippet: "Spam" });
    await mod.as.mutation(api.moderation.act, { reportId: reports[0]!.id, action: "remove" });
    expect(await mod.as.query(api.lists.get, { id })).toBeNull();

    const { id: kept } = await bia.as.mutation(api.lists.create, { title: "Favoritos" });
    await bia.as.mutation(api.lists.addBook, { listId: kept, book: book("OL1W", "It") });
    const data = await bia.as.query(api.account.exportData, {});
    expect(data.lists).toMatchObject([{ title: "Favoritos", books: [{ book: "It" }] }]);
    await t.run((ctx) => ctx.db.patch(bia.id, { deletedAt: Date.now() }));
    await t.mutation(internal.account.purge, { userId: bia.id, step: 0 });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(await t.run((ctx) => ctx.db.query("lists").collect())).toEqual([]);
    expect(await t.run((ctx) => ctx.db.query("listItems").collect())).toEqual([]);
  });
});
