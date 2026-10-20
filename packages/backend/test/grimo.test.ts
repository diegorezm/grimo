import { describe, expect, it } from "vitest";
import { api } from "../convex/_generated/api";
import { newTest, reader } from "./setup";

const book = {
  openLibraryId: "OL1W",
  title: "Duna",
  authors: ["Frank Herbert"],
  coverUrl: null,
  pageCount: 600,
  publishedYear: 1965,
  genres: ["science_fiction"],
};

describe("auth", () => {
  it("rejects signed-in queries when signed out", async () => {
    const t = newTest();
    await expect(t.query(api.shelves.list, {})).rejects.toThrow(/Não autenticado/);
  });
});

describe("shelves", () => {
  it("adds, logs progress and finishes a book", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");

    const { entry } = await rafa.as.mutation(api.shelves.add, { book, status: "reading" });
    expect(entry.startedAt).not.toBeNull();
    await rafa.as.mutation(api.shelves.update, { id: entry.id, currentPage: 100 });
    await rafa.as.mutation(api.shelves.update, { id: entry.id, status: "read", rating: 5 });

    const { items } = await rafa.as.query(api.shelves.list, {});
    expect(items).toHaveLength(1);
    expect(items[0]?.entry).toMatchObject({ status: "read", currentPage: 600, rating: 5 });

    const year = new Date().getUTCFullYear();
    const overview = await rafa.as.query(api.stats.overview, { year });
    expect(overview).toMatchObject({ booksRead: 1, pagesRead: 600 });

    const feed = await rafa.as.query(api.feed.list, { limit: 20 });
    expect(feed.items.map((item) => item.kind)).toEqual(["finished", "progress", "shelved"]);

    await rafa.as.mutation(api.shelves.remove, { id: entry.id });
    expect((await rafa.as.query(api.shelves.list, {})).items).toHaveLength(0);
  });

  it("validates input with the core schemas", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const { entry } = await rafa.as.mutation(api.shelves.add, { book, status: "reading" });
    await expect(
      rafa.as.mutation(api.shelves.update, { id: entry.id, rating: 9 }),
    ).rejects.toThrow();
  });
});

describe("social", () => {
  it("follows, shows the feed and likes posts", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");

    await rafa.as.mutation(api.users.setFollowing, { userId: bia.id, follow: true });
    await rafa.as.mutation(api.users.setFollowing, { userId: bia.id, follow: true });
    const page = await rafa.as.query(api.users.byUsername, { username: "bia", year: 2026 });
    expect(page).toMatchObject({ isFollowing: true, profile: { followers: 1 } });

    await bia.as.mutation(api.posts.create, { kind: "note", body: "Oi!" });
    const feed = await rafa.as.query(api.feed.list, { limit: 20 });
    const post = feed.items.find((item) => item.kind === "posted")?.post;
    expect(post).toMatchObject({ body: "Oi!", likeCount: 0, likedByMe: false });

    await rafa.as.mutation(api.posts.setLiked, { postId: post!.id, like: true });
    await rafa.as.mutation(api.posts.setLiked, { postId: post!.id, like: true });
    const detail = await rafa.as.query(api.posts.get, { id: post!.id });
    expect(detail.post).toMatchObject({ likeCount: 1, likedByMe: true });

    // Unfollowing takes the "começou a seguir" line back.
    await rafa.as.mutation(api.users.setFollowing, { userId: bia.id, follow: false });
    const mine = await rafa.as.query(api.users.activity, { username: "rafa", limit: 20 });
    expect(mine.items.some((item) => item.kind === "followed")).toBe(false);
  });

  it("lists more as the limit grows", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    for (let i = 0; i < 3; i++)
      await rafa.as.mutation(api.posts.create, { kind: "note", body: `${i}` });
    const first = await rafa.as.query(api.feed.list, { limit: 2 });
    expect(first).toMatchObject({ hasMore: true });
    expect(first.items).toHaveLength(2);
    const all = await rafa.as.query(api.feed.list, { limit: 4 });
    expect(all).toMatchObject({ hasMore: false });
    expect(all.items.map((item) => item.post?.body)).toEqual(["2", "1", "0"]);
  });
});

describe("setup", () => {
  it("new accounts confirm name and a free @", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const fresh = await reader(t, "leitor1234");
    await t.run((ctx) => ctx.db.patch(fresh.id, { name: "", setupDone: false }));

    expect((await fresh.as.query(api.users.me, {})).needsSetup).toBe(true);
    expect((await rafa.as.query(api.users.me, {})).needsSetup).toBe(false);

    expect(await fresh.as.query(api.users.usernameAvailable, { username: "rafa" })).toEqual({
      valid: true,
      available: false,
    });
    expect(await fresh.as.query(api.users.usernameAvailable, { username: "A!" })).toEqual({
      valid: false,
      available: false,
    });
    await expect(
      fresh.as.mutation(api.users.completeSetup, { name: "Ana", username: "rafa" }),
    ).rejects.toThrow(/já tem dono/);
    await expect(
      fresh.as.mutation(api.users.completeSetup, { name: " ", username: "ana" }),
    ).rejects.toThrow();

    await fresh.as.mutation(api.users.completeSetup, { name: "Ana Prado", username: "Ana.Prado" });
    expect(await fresh.as.query(api.users.me, {})).toMatchObject({
      name: "Ana Prado",
      username: "ana.prado",
      needsSetup: false,
    });
  });
});

describe("avatar", () => {
  // convex-test does not keep a file's content type (real uploads get it from the request), so
  // only the rejection path can run here; the accepted path is checked against a deployment.
  it("rejects files that are not photos", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const file = await t.run((ctx) =>
      ctx.storage.store(new Blob(["%PDF"], { type: "application/pdf" })),
    );
    await expect(rafa.as.mutation(api.users.setAvatar, { storageId: file })).rejects.toThrow(/JPG/);
  });

  it("removing the photo clears the image", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const profile = await rafa.as.mutation(api.users.removeAvatar, {});
    expect(profile.image).toBeNull();
  });
});
