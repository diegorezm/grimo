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

async function setup() {
  const t = newTest();
  const rafa = await reader(t, "rafa");
  const bia = await reader(t, "bia");
  await bia.as.mutation(api.users.setFollowing, { userId: rafa.id, follow: true });
  const { entry } = await rafa.as.mutation(api.shelves.add, { book, status: "reading" });
  return { t, rafa, bia, entry };
}

const feedOf = async (who: Awaited<ReturnType<typeof reader>>) =>
  (await who.as.query(api.feed.list, { limit: 20 })).items;

/** Rafa's update of this kind in Bia's feed (fake timers: activities share a timestamp). */
const rafaDid = async (who: Awaited<ReturnType<typeof reader>>, kind: string) =>
  (await feedOf(who)).find((item) => item.actor.username === "rafa" && item.kind === kind);

describe("reacting to feed updates", () => {
  it("likes and comments on any update, like a post", async () => {
    const { rafa, bia } = await setup();
    const shelved = await rafaDid(bia, "shelved");
    expect(shelved).toMatchObject({ post: null });

    await bia.as.mutation(api.posts.setActivityLiked, { activityId: shelved!.id, like: true });
    let item = await rafaDid(bia, "shelved");
    expect(item?.post).toMatchObject({ kind: "update", body: "", likeCount: 1, likedByMe: true });

    const { post } = await bia.as.mutation(api.posts.activityPost, { activityId: shelved!.id });
    expect(post.id).toBe(item?.post?.id);
    await bia.as.mutation(api.posts.comment, { postId: post.id, body: "Que livro!" });
    const thread = await bia.as.query(api.posts.get, { id: post.id });
    expect(thread.update).toMatchObject({ kind: "shelved", pages: 600 });
    expect(thread.comments.map((comment) => comment.body)).toEqual(["Que livro!"]);

    const notifications = (await rafa.as.query(api.notifications.list, { limit: 20 })).items;
    const onUpdate = notifications.filter((n) => n.kind !== "follow");
    expect(onUpdate.map((n) => [n.kind, n.post?.kind])).toEqual([
      ["comment", "update"],
      ["like", "update"],
    ]);

    // Deleting the update's post (its author or moderation) keeps the update in the feed.
    await rafa.as.mutation(api.posts.remove, { id: post.id });
    item = await rafaDid(bia, "shelved");
    expect(item).toMatchObject({ id: shelved!.id, post: null });
  });

  it("takes a note when marking the page", async () => {
    const { rafa, bia, entry } = await setup();
    await rafa.as.mutation(api.shelves.update, {
      id: entry.id,
      currentPage: 120,
      note: { body: "Que capítulo, @bia!", hasSpoilers: false },
    });
    const progress = await rafaDid(bia, "progress");
    expect(progress).toMatchObject({
      data: { page: 120 },
      post: { kind: "update", body: "Que capítulo, @bia!" },
    });
    const notifications = (await bia.as.query(api.notifications.list, { limit: 20 })).items;
    expect(notifications.map((n) => n.kind)).toEqual(["mention"]);

    // Same page: nothing new in the feed, so nothing to comment on (and nothing saved).
    await expect(
      rafa.as.mutation(api.shelves.update, {
        id: entry.id,
        currentPage: 120,
        note: { body: "de novo", hasSpoilers: false },
      }),
    ).rejects.toThrow(/página nova/);
    await expect(
      rafa.as.mutation(api.shelves.update, {
        id: entry.id,
        currentPage: 130,
        note: { body: "  ", hasSpoilers: false },
      }),
    ).rejects.toThrow(/Escreva/);
  });

  it("refuses follows, blocked readers and unliking what nobody liked", async () => {
    const { rafa, bia } = await setup();
    await rafa.as.mutation(api.users.setFollowing, { userId: bia.id, follow: true });
    const follow = (await feedOf(rafa)).find((item) => item.kind === "followed");
    await expect(
      bia.as.mutation(api.posts.setActivityLiked, { activityId: follow!.id, like: true }),
    ).rejects.toThrow(/reagir/);

    const shelved = await rafaDid(bia, "shelved");
    expect(
      await bia.as.mutation(api.posts.setActivityLiked, { activityId: shelved!.id, like: false }),
    ).toEqual({ liked: false });
    expect((await rafaDid(bia, "shelved"))?.post).toBeNull();

    await rafa.as.mutation(api.moderation.setBlocked, { userId: bia.id, block: true });
    await expect(
      bia.as.mutation(api.posts.setActivityLiked, { activityId: shelved!.id, like: true }),
    ).rejects.toThrow(/interagir/);
  });
});
