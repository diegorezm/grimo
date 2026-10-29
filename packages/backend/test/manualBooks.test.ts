import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "../convex/_generated/api";
import { newTest, reader } from "./setup";

beforeEach(() => {
  vi.useFakeTimers();
  // Open Library knows nothing: search results come only from approved hand-added books.
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ docs: [] }))),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const manual = {
  title: "Contos da Vila",
  authors: ["Fulana de Tal"],
  pageCount: 120,
  publishedYear: 2021,
  status: "reading" as const,
};

describe("hand-added books", () => {
  it("stay with whoever added them until moderation approves", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    await bia.as.mutation(api.users.setFollowing, { userId: rafa.id, follow: true });

    const { openLibraryId } = await rafa.as.mutation(api.books.addManual, manual);
    expect(openLibraryId).toMatch(/^GR/);
    const mine = await rafa.as.query(api.books.detail, { openLibraryId });
    expect(mine.detail).toMatchObject({
      book: { title: "Contos da Vila", reviewStatus: "pending" },
      entry: { status: "reading" },
    });

    // Others: no book page, nothing in the feed or on the profile, can't shelve or read along.
    expect((await bia.as.query(api.books.detail, { openLibraryId })).detail).toBeNull();
    const feed = (await bia.as.query(api.feed.list, { limit: 20 })).items;
    expect(feed.filter((item) => item.actor.username === "rafa")).toEqual([]);
    const profile = await bia.as.query(api.users.byUsername, { username: "rafa", year: 2026 });
    expect(profile.books.reading).toEqual([]);
    const book = { ...manual, openLibraryId, coverUrl: null, genres: [] };
    const { status: _status, ...bookInput } = book;
    await expect(
      bia.as.mutation(api.shelves.add, { book: bookInput, status: "want_to_read" }),
    ).rejects.toThrow(/não encontrado/);
    await expect(
      rafa.as.mutation(api.groups.create, { book: bookInput, finishBy: null }),
    ).rejects.toThrow(/revisão/);
    // Nor can a client make one up with a GR id.
    await expect(
      bia.as.mutation(api.shelves.add, {
        book: { ...bookInput, openLibraryId: "GRABCDEFGHJK" },
        status: "reading",
      }),
    ).rejects.toThrow(/não encontrado/);

    await t.mutation(internal.moderation.reviewBook, { openLibraryId, approve: true });
    expect((await bia.as.query(api.books.detail, { openLibraryId })).detail?.book.title).toBe(
      "Contos da Vila",
    );
    await bia.as.mutation(api.shelves.add, { book: bookInput, status: "want_to_read" });
    const { items } = await bia.as.action(api.books.search, { q: "contos vila" });
    expect(items.map((item) => item.openLibraryId)).toEqual([openLibraryId]);
  });

  it("checks the form and goes with the account unless approved", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    await expect(
      rafa.as.mutation(api.books.addManual, { ...manual, title: " ", authors: [] }),
    ).rejects.toThrow(/título/);
    await rafa.as.mutation(api.books.addManual, manual);
    const data = await rafa.as.query(api.account.exportData, {});
    expect(data.booksAdded).toMatchObject([{ title: "Contos da Vila", review: "pending" }]);

    await t.run((ctx) => ctx.db.patch(rafa.id, { deletedAt: Date.now() }));
    await t.mutation(internal.account.purge, { userId: rafa.id, step: 0 });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(await t.run((ctx) => ctx.db.query("books").collect())).toEqual([]);
  });
});
