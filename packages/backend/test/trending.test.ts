import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../convex/_generated/api";
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

describe("em alta entre quem você segue", () => {
  it("ranks books by how many friends are reading them this month", async () => {
    const t = newTest();
    const me = await reader(t, "eu");
    const [rafa, bia, theo] = await Promise.all(
      ["rafa", "bia", "theo"].map((name) => reader(t, name)),
    );
    for (const friend of [rafa, bia]) {
      await me.as.mutation(api.users.setFollowing, { userId: friend!.id, follow: true });
    }

    await rafa!.as.mutation(api.shelves.add, { book: book("OL1W", "Duna"), status: "reading" });
    await bia!.as.mutation(api.shelves.add, { book: book("OL1W", "Duna"), status: "read" });
    await bia!.as.mutation(api.shelves.add, { book: book("OL2W", "Kindred"), status: "reading" });
    // Wanting to read isn't reading, and strangers don't count.
    await rafa!.as.mutation(api.shelves.add, {
      book: book("OL3W", "Só quero"),
      status: "want_to_read",
    });
    await theo!.as.mutation(api.shelves.add, { book: book("OL2W", "Kindred"), status: "read" });
    await me.as.mutation(api.shelves.add, {
      book: book("OL2W", "Kindred"),
      status: "want_to_read",
    });

    const { items } = await me.as.query(api.feed.trending, { limit: 10 });
    expect(items.map((item) => [item.book.title, item.friends.length, item.viewerStatus])).toEqual([
      ["Duna", 2, null],
      ["Kindred", 1, "want_to_read"],
    ]);

    // A month later it has cooled down.
    vi.setSystemTime(Date.now() + 31 * 24 * 60 * 60 * 1000);
    expect((await me.as.query(api.feed.trending, { limit: 10 })).items).toEqual([]);
  });
});
