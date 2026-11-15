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
  vi.setSystemTime(new Date("2026-10-01T12:00:00Z"));
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ docs: [] }))),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

async function setup() {
  const t = newTest();
  const rafa = await reader(t, "rafa");
  const bia = await reader(t, "bia");
  await rafa.as.mutation(api.users.setPrivate, { isPrivate: true });
  const { entry } = await rafa.as.mutation(api.shelves.add, { book, status: "reading" });
  await rafa.as.mutation(api.shelves.update, { id: entry.id, currentPage: 100 });
  const { post } = await rafa.as.mutation(api.posts.create, {
    kind: "review",
    bookId: entry.bookId,
    rating: 4,
    body: "Muito bom",
    hasSpoilers: false,
  });
  return { t, rafa, bia, postId: post.id };
}

const page = (who: Awaited<ReturnType<typeof reader>>) =>
  who.as.query(api.users.byUsername, { username: "rafa", year: 2026 });

describe("private profiles", () => {
  it("show only the header to readers who don't follow them", async () => {
    const { t, bia, postId } = await setup();

    const profile = await page(bia);
    expect(profile).toMatchObject({ canSeeReading: false, stats: null, requested: false });
    expect(profile.profile.isPrivate).toBe(true);
    expect(profile.books.reading).toEqual([]);
    expect((await bia.as.query(api.users.activity, { username: "rafa", limit: 20 })).items).toEqual(
      [],
    );
    expect((await bia.as.query(api.feed.community, { limit: 20 })).items).toEqual([]);
    expect(
      (await bia.as.query(api.books.detail, { openLibraryId: "OL1W" })).detail?.reviews,
    ).toEqual([]);
    await expect(bia.as.query(api.posts.get, { id: postId })).rejects.toThrow(/não encontrado/);
    // Signed out too.
    expect(
      (await t.query(api.users.byUsername, { username: "rafa", year: 2026 })).canSeeReading,
    ).toBe(false);
  });

  it("turn a follow into a request, and show everything once it is accepted", async () => {
    const { rafa, bia, postId } = await setup();

    const result = await bia.as.mutation(api.users.setFollowing, { userId: rafa.id, follow: true });
    expect(result).toEqual({ following: false, requested: true });
    expect(await page(bia)).toMatchObject({ isFollowing: false, requested: true });
    const [request] = (await rafa.as.query(api.notifications.list, { limit: 20 })).items;
    expect(request).toMatchObject({ kind: "follow_request", requestPending: true });

    await rafa.as.mutation(api.users.answerFollowRequest, { userId: bia.id, accept: true });
    expect(await page(bia)).toMatchObject({ isFollowing: true, canSeeReading: true });
    expect((await bia.as.query(api.feed.list, { limit: 20 })).items.length).toBeGreaterThan(0);
    expect((await bia.as.query(api.posts.get, { id: postId })).post.body).toBe("Muito bom");
    const notices = (await bia.as.query(api.notifications.list, { limit: 20 })).items;
    expect(notices.map((n) => n.kind)).toEqual(["follow_accepted"]);
  });

  it("forget a declined or withdrawn request, and accept the pending ones when made public", async () => {
    const { t, rafa, bia } = await setup();
    const theo = await reader(t, "theo");

    await bia.as.mutation(api.users.setFollowing, { userId: rafa.id, follow: true });
    await rafa.as.mutation(api.users.answerFollowRequest, { userId: bia.id, accept: false });
    expect(await page(bia)).toMatchObject({ requested: false, isFollowing: false });

    await theo.as.mutation(api.users.setFollowing, { userId: rafa.id, follow: true });
    await theo.as.mutation(api.users.setFollowing, { userId: rafa.id, follow: false });
    expect((await rafa.as.query(api.notifications.list, { limit: 20 })).items).toEqual([]);

    await bia.as.mutation(api.users.setFollowing, { userId: rafa.id, follow: true });
    await rafa.as.mutation(api.users.setPrivate, { isPrivate: false });
    expect(await page(bia)).toMatchObject({ isFollowing: true, canSeeReading: true });
  });
});
