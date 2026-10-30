import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../convex/_generated/api";
import { newTest, reader } from "./setup";

const book = {
  openLibraryId: "OL1W",
  title: "Torto Arado",
  authors: ["Itamar Vieira Junior"],
  coverUrl: null,
  pageCount: 264,
  publishedYear: 2019,
  genres: [],
};

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

describe("leituras abertas", () => {
  it("are listed for everyone and joined without an invite", async () => {
    const t = newTest();
    const bia = await reader(t, "bia");
    const rafa = await reader(t, "rafa");
    const { id } = await bia.as.mutation(api.groups.create, {
      book,
      finishBy: null,
      open: true,
    });
    // A closed group stays out of the lists.
    await bia.as.mutation(api.groups.create, { book, finishBy: null });

    const forBook = await rafa.as.query(api.groups.openForBook, { openLibraryId: "OL1W" });
    expect(forBook.items).toMatchObject([
      { id, memberCount: 1, isMember: false, members: [{ username: "bia" }] },
    ]);
    expect((await rafa.as.query(api.groups.openRecent, {})).items).toMatchObject([{ id }]);

    await rafa.as.mutation(api.groups.joinOpen, { id });
    expect((await rafa.as.query(api.groups.detail, { id })).members).toHaveLength(2);
    const { items } = await rafa.as.query(api.shelves.list, {});
    expect(items[0]?.entry.status).toBe("reading");
    // Already in: it leaves "entre numa leitura".
    expect((await rafa.as.query(api.groups.openRecent, {})).items).toEqual([]);
  });

  it("only its creator opens or closes it, and a closed one can't be joined", async () => {
    const t = newTest();
    const bia = await reader(t, "bia");
    const rafa = await reader(t, "rafa");
    const theo = await reader(t, "theo");
    const { id } = await bia.as.mutation(api.groups.create, { book, finishBy: null, open: true });
    await rafa.as.mutation(api.groups.joinOpen, { id });
    await expect(rafa.as.mutation(api.groups.setOpen, { id, open: false })).rejects.toThrow(
      /criou/,
    );
    await bia.as.mutation(api.groups.setOpen, { id, open: false });
    await expect(theo.as.mutation(api.groups.joinOpen, { id })).rejects.toThrow(/aberta/);
    expect((await theo.as.query(api.groups.openForBook, { openLibraryId: "OL1W" })).items).toEqual(
      [],
    );
  });
});
