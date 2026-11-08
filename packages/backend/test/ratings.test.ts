import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../convex/_generated/api";
import { onAccountDeleted } from "../convex/account";
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
  vi.setSystemTime(new Date("2026-11-03T12:00:00Z"));
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

const detailOf = async (who: Reader) =>
  (await who.as.query(api.books.detail, { openLibraryId: book.openLibraryId })).detail!;

const shelve = async (who: Reader, status: "reading" | "read" | "abandoned" = "read") =>
  (await who.as.mutation(api.shelves.add, { book, status })).entry;

describe("rating a book", () => {
  it("takes half stars and fills the star bars and feelings of the book page", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    const theo = await reader(t, "theo");
    const mine = await shelve(rafa);
    const hers = await shelve(bia);
    await shelve(theo, "abandoned");

    await rafa.as.mutation(api.shelves.update, {
      id: mine.id,
      rating: 4.5,
      feelings: ["tensao", "esperanca"],
    });
    await bia.as.mutation(api.shelves.update, { id: hers.id, rating: 3, feelings: ["tensao"] });
    let { community, entry } = await detailOf(rafa);
    expect(entry).toMatchObject({ rating: 4.5, feelings: ["tensao", "esperanca"] });
    expect(community).toMatchObject({
      readers: 3,
      ratings: 2,
      averageRating: 3.8,
      stars: [0, 0, 1, 1, 0],
      feelingReaders: 2,
      feelings: [
        { feeling: "tensao", label: "Tensão", count: 2, percent: 100 },
        { feeling: "esperanca", label: "Esperança", count: 1, percent: 50 },
      ],
    });

    // Changing your mind moves the counts; clearing takes you out of them.
    await bia.as.mutation(api.shelves.update, { id: hers.id, rating: null, feelings: [] });
    ({ community } = await detailOf(rafa));
    expect(community).toMatchObject({
      ratings: 1,
      averageRating: 4.5,
      stars: [0, 0, 0, 1, 0],
      feelingReaders: 1,
      // A tie goes in the order of the list.
      feelings: [
        { feeling: "esperanca", percent: 100 },
        { feeling: "tensao", percent: 100 },
      ],
    });

    await rafa.as.mutation(api.shelves.remove, { id: mine.id });
    ({ community } = await detailOf(bia));
    expect(community).toMatchObject({
      readers: 2,
      ratings: 0,
      stars: [0, 0, 0, 0, 0],
      feelingReaders: 0,
      feelings: [],
    });
  });

  it("refuses ratings off the half-star scale and feelings off the list", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const { id } = await shelve(rafa);
    await expect(rafa.as.mutation(api.shelves.update, { id, rating: 4.2 })).rejects.toThrow(
      /Nota inválida/,
    );
    await expect(
      rafa.as.mutation(api.shelves.update, { id, feelings: ["saudade"] }),
    ).rejects.toThrow(/Sentimento inválido/);
    await expect(
      rafa.as.mutation(api.shelves.update, {
        id,
        feelings: ["alegria", "medo", "raiva", "tedio"],
      }),
    ).rejects.toThrow(/até 3/);
  });

  it("counts a book from before the star bars from its shelves", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const { id } = await shelve(rafa);
    await rafa.as.mutation(api.shelves.update, { id, rating: 2.5, feelings: ["tedio"] });
    await t.run(async (ctx) => {
      const row = (await ctx.db.query("books").first())!;
      const { ratingStars, feelingCounts, feelingReaders, ...older } = row;
      await ctx.db.replace(row._id, older);
    });
    expect((await detailOf(rafa)).community).toMatchObject({
      ratings: 1,
      stars: [0, 1, 0, 0, 0],
      feelings: [{ feeling: "tedio", count: 1 }],
    });
  });
});

describe("feelings while reading", () => {
  it("go on the feed card and the diary, which suggests what to rate with", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    await bia.as.mutation(api.users.setFollowing, { userId: rafa.id, follow: true });
    const { id } = await shelve(rafa, "reading");

    const mark = async (currentPage: number, pageFeelings: string[]) => {
      vi.advanceTimersByTime(60_000);
      await rafa.as.mutation(api.shelves.update, { id, currentPage, pageFeelings });
    };
    await mark(50, ["curiosidade"]);
    await mark(200, ["tensao", "medo"]);
    await mark(320, []);
    await mark(450, ["tensao", "tristeza"]);

    const { diary } = await detailOf(rafa);
    expect(diary.marks.map((m) => [m.page, m.feelings])).toEqual([
      [50, ["curiosidade"]],
      [200, ["tensao", "medo"]],
      [450, ["tensao", "tristeza"]],
    ]);
    expect(diary.suggested).toEqual(["tensao", "tristeza", "medo"]);
    // Your diary is yours.
    expect((await detailOf(bia)).diary.marks).toEqual([]);

    const feed = (await bia.as.query(api.feed.list, { limit: 20 })).items;
    const progress = feed.find((item) => item.kind === "progress" && item.data?.page === 450);
    expect(progress?.data).toMatchObject({ feelings: ["tensao", "tristeza"] });

    // Finishing with the feelings puts them on the "terminou" card.
    vi.advanceTimersByTime(60_000);
    await rafa.as.mutation(api.shelves.update, {
      id,
      status: "read",
      rating: 4,
      feelings: diary.suggested,
    });
    const finished = (await bia.as.query(api.feed.list, { limit: 20 })).items.find(
      (item) => item.kind === "finished",
    );
    expect(finished?.reading).toMatchObject({
      rating: 4,
      feelings: ["tensao", "tristeza", "medo"],
    });
  });

  it("need a new page, like a note", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const { id } = await shelve(rafa, "reading");
    await rafa.as.mutation(api.shelves.update, { id, currentPage: 10 });
    await expect(
      rafa.as.mutation(api.shelves.update, { id, currentPage: 10, pageFeelings: ["alegria"] }),
    ).rejects.toThrow(/página nova/);
  });
});

describe("one rating per reader and book", () => {
  it("a review shows the shelf's rating, sets it, and follows it", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const { id } = await shelve(rafa);
    await rafa.as.mutation(api.shelves.update, { id, rating: 4 });
    const bookId = (await detailOf(rafa)).book.id!;

    const { post: first } = await rafa.as.mutation(api.posts.create, {
      kind: "review",
      bookId,
      body: "Gostei muito.",
    });
    expect((await rafa.as.query(api.posts.get, { id: first.id })).post.rating).toBe(4);

    await rafa.as.mutation(api.posts.create, {
      kind: "review",
      bookId,
      rating: 2.5,
      body: "Relendo, gostei menos.",
    });
    let detail = await detailOf(rafa);
    expect(detail.entry?.rating).toBe(2.5);
    expect(detail.community).toMatchObject({ ratings: 1, averageRating: 2.5 });
    expect(detail.reviews.map((review) => review.rating)).toEqual([2.5, 2.5]);

    await rafa.as.mutation(api.shelves.update, { id, rating: 5 });
    detail = await detailOf(rafa);
    expect(detail.reviews.map((review) => review.rating)).toEqual([5, 5]);
  });
});

describe("feelings and personal data", () => {
  it("are in the export and leave the book's counts with the account", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    const { id } = await shelve(rafa, "reading");
    await rafa.as.mutation(api.shelves.update, { id, currentPage: 30, pageFeelings: ["alegria"] });
    await rafa.as.mutation(api.shelves.update, {
      id,
      status: "read",
      rating: 5,
      feelings: ["alegria", "conforto"],
    });
    await shelve(bia);

    const data = await t
      .withIdentity({ subject: "auth-rafa", email: "rafa@grimo.test" })
      .action(api.account.exportData, {});
    expect(data.shelf).toMatchObject([
      { book: "Duna", rating: 5, feelings: ["alegria", "conforto"] },
    ]);
    // Finishing logs the pages left, without feelings.
    expect(data.readingLog).toMatchObject([
      { page: 30, feelings: ["alegria"] },
      { page: 600, feelings: [] },
    ]);

    await t.run((ctx) => onAccountDeleted(ctx, "auth-rafa"));
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect((await detailOf(bia)).community).toMatchObject({
      readers: 1,
      ratings: 0,
      stars: [0, 0, 0, 0, 0],
      feelingReaders: 0,
      feelings: [],
    });
  });
});
