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
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ docs: [] }))),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("feed cards", () => {
  it("bring the edition's pages, the rating and where the book is on my shelves", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    await bia.as.mutation(api.users.setFollowing, { userId: rafa.id, follow: true });

    const { entry } = await rafa.as.mutation(api.shelves.add, { book, status: "reading" });
    await rafa.as.mutation(api.shelves.update, { id: entry.id, pageCount: 400 });
    await rafa.as.mutation(api.shelves.update, { id: entry.id, currentPage: 100 });

    let items = (await bia.as.query(api.feed.list, { limit: 20 })).items;
    const progress = items.find((item) => item.kind === "progress");
    expect(progress?.data).toMatchObject({ page: 100 });
    expect(progress?.reading).toEqual({ pages: 400, rating: null, viewerStatus: null });

    await rafa.as.mutation(api.shelves.update, { id: entry.id, status: "read", rating: 4 });
    await bia.as.mutation(api.shelves.add, { book, status: "want_to_read" });
    items = (await bia.as.query(api.feed.list, { limit: 20 })).items;
    const finished = items.find((item) => item.kind === "finished");
    expect(finished?.reading).toEqual({ pages: 400, rating: 4, viewerStatus: "want_to_read" });
    // On my own activity, "my shelf" is the actor's.
    const mine = items.find((item) => item.actor.username === "bia");
    expect(mine?.reading?.viewerStatus).toBe("want_to_read");
  });

  it("community shows everyone except follows and blocked readers", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    const theo = await reader(t, "theo");
    await rafa.as.mutation(api.shelves.add, { book, status: "reading" });
    await theo.as.mutation(api.users.setFollowing, { userId: rafa.id, follow: true });

    // Bia follows nobody: her "Seguindo" is empty, the community isn't.
    expect((await bia.as.query(api.feed.list, { limit: 20 })).items).toEqual([]);
    const community = await bia.as.query(api.feed.community, { limit: 20 });
    expect(community.items.map((item) => [item.actor.username, item.kind])).toEqual([
      ["rafa", "shelved"],
    ]);

    await bia.as.mutation(api.moderation.setBlocked, { userId: rafa.id, block: true });
    expect((await bia.as.query(api.feed.community, { limit: 20 })).items).toEqual([]);
  });

  it("community pages by limit", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    for (const id of ["OL1W", "OL2W", "OL3W"]) {
      await rafa.as.mutation(api.shelves.add, {
        book: { ...book, openLibraryId: id },
        status: "want_to_read",
      });
    }
    const first = await bia.as.query(api.feed.community, { limit: 2 });
    expect(first.items).toHaveLength(2);
    expect(first.hasMore).toBe(true);
    const all = await bia.as.query(api.feed.community, { limit: 4 });
    expect(all.items).toHaveLength(3);
    expect(all.hasMore).toBe(false);
  });
});
