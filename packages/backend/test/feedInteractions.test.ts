import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "../convex/_generated/api";
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

type Reader = Awaited<ReturnType<typeof reader>>;

async function setup() {
  const t = newTest();
  const rafa = await reader(t, "rafa");
  const bia = await reader(t, "bia");
  const theo = await reader(t, "theo");
  return { t, rafa, bia, theo };
}

const follow = (who: Reader, whom: Reader, follow = true) =>
  who.as.mutation(api.users.setFollowing, { userId: whom.id, follow });

const note = async (who: Reader, body: string) => {
  const { post } = await who.as.mutation(api.posts.create, { kind: "note", body });
  vi.advanceTimersByTime(60_000);
  return post.id;
};

const feedOf = async (who: Reader) => (await who.as.query(api.feed.list, { limit: 20 })).items;

/** The posts in `who`'s feed, newest first, as "@author: body". */
const postsIn = async (who: Reader) =>
  (await feedOf(who))
    .filter((item) => item.kind === "posted")
    .map((item) => `@${item.actor.username}: ${item.post?.body}`);

/** The card of this post in `who`'s feed. */
const cardOf = async (who: Reader, postId: string) =>
  (await feedOf(who)).find((item) => item.post?.id === postId)?.post;

describe("feed interactions", () => {
  it("mixes the people I follow, newest first, and drops them when I unfollow", async () => {
    const { rafa, bia, theo } = await setup();
    await follow(bia, rafa);
    await follow(bia, theo);
    await note(rafa, "primeiro");
    await note(theo, "segundo");
    await note(rafa, "terceiro");
    await note(bia, "meu");

    expect(await postsIn(bia)).toEqual([
      "@bia: meu",
      "@rafa: terceiro",
      "@theo: segundo",
      "@rafa: primeiro",
    ]);
    // Following is one way: Rafa sees only his own posts.
    expect(await postsIn(rafa)).toEqual(["@rafa: terceiro", "@rafa: primeiro"]);

    await follow(bia, theo, false);
    expect(await postsIn(bia)).toEqual(["@bia: meu", "@rafa: terceiro", "@rafa: primeiro"]);
    expect((await feedOf(bia)).some((item) => item.target?.username === "theo")).toBe(false);

    // The feed is read on demand: following again brings the old posts back.
    await follow(bia, theo);
    expect(await postsIn(bia)).toContain("@theo: segundo");
  });

  it("counts likes per reader and never goes below zero", async () => {
    const { rafa, bia, theo } = await setup();
    await follow(bia, rafa);
    await follow(theo, rafa);
    const postId = await note(rafa, "Terminei Duna!");

    await bia.as.mutation(api.posts.setLiked, { postId, like: true });
    await theo.as.mutation(api.posts.setLiked, { postId, like: true });
    expect(await cardOf(bia, postId)).toMatchObject({ likeCount: 2, likedByMe: true });
    expect(await cardOf(rafa, postId)).toMatchObject({ likeCount: 2, likedByMe: false });

    await theo.as.mutation(api.posts.setLiked, { postId, like: false });
    await theo.as.mutation(api.posts.setLiked, { postId, like: false });
    expect(await cardOf(theo, postId)).toMatchObject({ likeCount: 1, likedByMe: false });
    expect(await cardOf(bia, postId)).toMatchObject({ likeCount: 1, likedByMe: true });

    // Liking your own post counts, but doesn't notify you.
    await rafa.as.mutation(api.posts.setLiked, { postId, like: true });
    expect(await cardOf(rafa, postId)).toMatchObject({ likeCount: 2, likedByMe: true });
    const notifications = (await rafa.as.query(api.notifications.list, { limit: 20 })).items;
    expect(notifications.filter((n) => n.kind === "like")).toHaveLength(1);
  });

  it("keeps the comment count on the card in step with the thread", async () => {
    const { rafa, bia, theo } = await setup();
    await follow(bia, rafa);
    const postId = await note(rafa, "Alguém já leu Duna?");

    const { comment: first } = await bia.as.mutation(api.posts.comment, { postId, body: "Eu!" });
    await bia.as.mutation(api.posts.comment, { postId, body: "Amei o final." });
    const { comment: theos } = await theo.as.mutation(api.posts.comment, {
      postId,
      body: "Está na minha lista.",
    });
    expect(await cardOf(bia, postId)).toMatchObject({ commentCount: 3 });
    const thread = await bia.as.query(api.posts.get, { id: postId });
    expect(thread.comments.map((c) => `@${c.author.username}: ${c.body}`)).toEqual([
      "@bia: Eu!",
      "@bia: Amei o final.",
      "@theo: Está na minha lista.",
    ]);

    // Only the comment's author and the post's author may delete it.
    await expect(theo.as.mutation(api.posts.removeComment, { id: first.id })).rejects.toThrow(
      /não pode apagar/,
    );
    await bia.as.mutation(api.posts.removeComment, { id: first.id });
    await rafa.as.mutation(api.posts.removeComment, { id: theos.id });
    expect(await cardOf(bia, postId)).toMatchObject({ commentCount: 1 });
    expect((await bia.as.query(api.posts.get, { id: postId })).comments).toHaveLength(1);
  });

  it("rejects empty comments", async () => {
    const { rafa, bia } = await setup();
    const postId = await note(rafa, "Oi");
    await expect(bia.as.mutation(api.posts.comment, { postId, body: "   " })).rejects.toThrow();
    expect((await bia.as.query(api.posts.get, { id: postId })).post.commentCount).toBe(0);
  });

  it("brings a review's book, rating and spoiler warning to the card", async () => {
    const { rafa, bia } = await setup();
    await follow(bia, rafa);
    await rafa.as.mutation(api.shelves.add, { book, status: "read" });
    const { detail } = await rafa.as.query(api.books.detail, { openLibraryId: "OL1W" });
    await rafa.as.mutation(api.posts.create, {
      kind: "review",
      bookId: detail!.book.id!,
      rating: 4,
      body: "O final com o verme é incrível.",
      hasSpoilers: true,
    });

    const review = (await feedOf(bia)).find((item) => item.post?.kind === "review");
    expect(review).toMatchObject({
      kind: "posted",
      data: { postKind: "review" },
      actor: { username: "rafa" },
      book: { title: "Duna", openLibraryId: "OL1W" },
      post: { rating: 4, hasSpoilers: true, likeCount: 0, commentCount: 0 },
    });
  });

  it("takes a post out of the feed, with its likes and comments, when its author deletes it", async () => {
    const { t, rafa, bia } = await setup();
    await follow(bia, rafa);
    const postId = await note(rafa, "Vou apagar");
    await bia.as.mutation(api.posts.setLiked, { postId, like: true });
    await bia.as.mutation(api.posts.comment, { postId, body: "Não apaga!" });

    // Someone else can't delete it (it is a no-op, not an error).
    await bia.as.mutation(api.posts.remove, { id: postId });
    expect(await cardOf(bia, postId)).toBeDefined();

    await rafa.as.mutation(api.posts.remove, { id: postId });
    expect(await cardOf(bia, postId)).toBeUndefined();
    await expect(bia.as.query(api.posts.get, { id: postId })).rejects.toThrow(/não encontrado/);
    await expect(bia.as.mutation(api.posts.setLiked, { postId, like: true })).rejects.toThrow(
      /não encontrado/,
    );
    const notifications = (await rafa.as.query(api.notifications.list, { limit: 20 })).items;
    expect(notifications.filter((n) => n.kind !== "follow")).toEqual([]);

    // Likes, comments and notifications go in batches, after the post.
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    const left = await t.run(async (ctx) => [
      ...(await ctx.db.query("postLikes").collect()),
      ...(await ctx.db.query("postComments").collect()),
      ...(await ctx.db.query("notifications").collect()).filter((n) => n.postId === postId),
    ]);
    expect(left).toEqual([]);
  });

  it("hides a suspended reader from followers and the community until it is lifted", async () => {
    const { t, rafa, bia, theo } = await setup();
    await follow(bia, rafa);
    await note(rafa, "Oi, gente");

    await t.mutation(internal.moderation.suspend, { username: "rafa", suspend: true });
    expect(await postsIn(bia)).toEqual([]);
    expect((await theo.as.query(api.feed.community, { limit: 20 })).items).toEqual([]);

    await t.mutation(internal.moderation.suspend, { username: "rafa", suspend: false });
    expect(await postsIn(bia)).toEqual(["@rafa: Oi, gente"]);
  });

  it("leaves a suspended reader's comments out of the count, everywhere", async () => {
    const { t, rafa, bia, theo } = await setup();
    await follow(bia, rafa);
    await rafa.as.mutation(api.shelves.add, { book, status: "read" });
    const { detail } = await rafa.as.query(api.books.detail, { openLibraryId: "OL1W" });
    const { post } = await rafa.as.mutation(api.posts.create, {
      kind: "review",
      bookId: detail!.book.id!,
      rating: 5,
      body: "Obra-prima.",
    });
    await theo.as.mutation(api.posts.comment, { postId: post.id, body: "Concordo" });
    await bia.as.mutation(api.posts.comment, { postId: post.id, body: "Também" });

    await t.mutation(internal.moderation.suspend, { username: "theo", suspend: true });
    expect(await cardOf(bia, post.id)).toMatchObject({ commentCount: 1 });
    const thread = await bia.as.query(api.posts.get, { id: post.id });
    expect([thread.post.commentCount, thread.comments.length]).toEqual([1, 1]);
    const page = await bia.as.query(api.books.detail, { openLibraryId: "OL1W" });
    expect(page.detail?.reviews).toMatchObject([{ id: post.id, commentCount: 1 }]);

    // Lifting the suspension brings the comment, and the count, back.
    await t.mutation(internal.moderation.suspend, { username: "theo", suspend: false });
    expect(await cardOf(bia, post.id)).toMatchObject({ commentCount: 2 });
  });

  it("after a block, the other reader's comments leave my threads and they can't comment", async () => {
    const { rafa, bia, theo } = await setup();
    await follow(bia, rafa);
    const postId = await note(rafa, "Qual o próximo?");
    await theo.as.mutation(api.posts.comment, { postId, body: "Fundação!" });
    await bia.as.mutation(api.posts.comment, { postId, body: "Hyperion." });

    await bia.as.mutation(api.moderation.setBlocked, { userId: theo.id, block: true });
    const thread = await bia.as.query(api.posts.get, { id: postId });
    expect(thread.comments.map((c) => c.author.username)).toEqual(["bia"]);
    // Rafa blocked nobody: he still sees both.
    expect((await rafa.as.query(api.posts.get, { id: postId })).comments).toHaveLength(2);

    // The count on the card and in the thread is what Bia can read.
    expect(await cardOf(bia, postId)).toMatchObject({ commentCount: 1 });
    expect(thread.post.commentCount).toBe(1);
    expect(await cardOf(rafa, postId)).toMatchObject({ commentCount: 2 });

    const biasPost = await note(bia, "Meu post");
    await expect(
      theo.as.mutation(api.posts.comment, { postId: biasPost, body: "Oi" }),
    ).rejects.toThrow(/interagir/);
    await expect(
      theo.as.mutation(api.posts.setLiked, { postId: biasPost, like: true }),
    ).rejects.toThrow(/interagir/);
  });
});
