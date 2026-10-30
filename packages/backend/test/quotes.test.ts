import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../convex/_generated/api";
import { newTest, reader } from "./setup";

const book = {
  openLibraryId: "OL1W",
  title: "Dom Casmurro",
  authors: ["Machado de Assis"],
  coverUrl: null,
  pageCount: 256,
  publishedYear: 1899,
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

describe("quotes", () => {
  it("go on the book page and in the feed, with their page", async () => {
    const t = newTest();
    const bia = await reader(t, "bia");
    const rafa = await reader(t, "rafa");
    await rafa.as.mutation(api.users.setFollowing, { userId: bia.id, follow: true });
    await bia.as.mutation(api.shelves.add, { book, status: "reading" });
    const { detail } = await bia.as.query(api.books.detail, { openLibraryId: "OL1W" });

    const { post } = await bia.as.mutation(api.posts.create, {
      kind: "quote",
      bookId: detail!.book.id!,
      body: "Olhos de cigana oblíqua e dissimulada.",
      page: 64,
    });
    await expect(
      bia.as.mutation(api.posts.create, { kind: "quote", body: "Sem livro" }),
    ).rejects.toThrow(/livro/);

    const page = await rafa.as.query(api.books.detail, { openLibraryId: "OL1W" });
    expect(page.detail?.quotes).toMatchObject([
      { id: post.id, kind: "quote", page: 64, author: { username: "bia" } },
    ]);
    expect(page.detail?.reviews).toEqual([]);

    const feed = (await rafa.as.query(api.feed.list, { limit: 20 })).items;
    const quoted = feed.find((item) => item.post?.id === post.id);
    expect(quoted).toMatchObject({ kind: "posted", data: { postKind: "quote" } });

    await rafa.as.mutation(api.posts.setLiked, { postId: post.id, like: true });
    const [notification] = (await bia.as.query(api.notifications.list, { limit: 20 })).items;
    expect(notification).toMatchObject({ kind: "like", post: { kind: "quote" } });
  });
});
