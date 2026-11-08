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

const song = {
  title: "Clair de Lune",
  artist: "Debussy",
  url: "https://open.spotify.com/track/abc",
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-08T12:00:00Z"));
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

async function shelvedBook(who: Reader) {
  await who.as.mutation(api.shelves.add, { book, status: "read" });
  return (await who.as.query(api.books.detail, { openLibraryId: book.openLibraryId })).detail!.book
    .id!;
}

describe("profile personalization", () => {
  it("shows the song, pronouns, cover, favorite books and a quote to other readers", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    const bookId = await shelvedBook(rafa);
    const { post } = await rafa.as.mutation(api.posts.create, {
      kind: "quote",
      bookId,
      body: "O medo é o assassino da mente.",
      page: 18,
    });

    await rafa.as.mutation(api.users.updateMe, {
      pronouns: "ela/dela",
      profileColor: "rose",
      profileSong: song,
      favoriteBookIds: [bookId],
      featuredQuoteId: post.id,
      profileShows: { goal: false, reading: true, streak: true },
    });

    const { profile } = await bia.as.query(api.users.byUsername, { username: "rafa", year: 2026 });
    expect(profile).toMatchObject({
      pronouns: "ela/dela",
      profileColor: "rose",
      profileSong: { ...song, service: "Spotify" },
      favoriteBooks: [{ title: "Duna" }],
      featuredQuote: { body: "O medo é o assassino da mente.", page: 18, bookTitle: "Duna" },
      profileShows: { goal: false, reading: true, streak: true },
    });

    // Clearing takes them off; a deleted quote just stops showing.
    await rafa.as.mutation(api.users.updateMe, { pronouns: "", profileSong: null });
    await rafa.as.mutation(api.posts.remove, { id: post.id });
    const me = await rafa.as.query(api.users.me, {});
    expect(me).toMatchObject({ pronouns: null, profileSong: null, featuredQuote: null });
  });

  it("has sensible defaults for readers who never personalized", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    expect(await rafa.as.query(api.users.me, {})).toMatchObject({
      profileColor: "lilac",
      favoriteBooks: [],
      featuredQuote: null,
      profileShows: { goal: true, reading: true, streak: false },
    });
  });

  it("refuses songs from other sites, someone else's quote and unknown books", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    const bookId = await shelvedBook(bia);
    const { post } = await bia.as.mutation(api.posts.create, {
      kind: "quote",
      bookId,
      body: "Uma frase da Bia.",
    });

    await expect(
      rafa.as.mutation(api.users.updateMe, {
        profileSong: { ...song, url: "https://example.com/x" },
      }),
    ).rejects.toThrow(/Spotify/);
    await expect(
      rafa.as.mutation(api.users.updateMe, { featuredQuoteId: post.id }),
    ).rejects.toThrow(/Citação/);
    await expect(
      rafa.as.mutation(api.users.updateMe, { favoriteBookIds: ["nope"] }),
    ).rejects.toThrow(/Livro/);
  });

  it("goes in the data export and leaves with the account", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bookId = await shelvedBook(rafa);
    await rafa.as.mutation(api.users.updateMe, {
      pronouns: "ela/dela",
      profileSong: song,
      favoriteBookIds: [bookId],
    });
    const data = await t
      .withIdentity({ subject: "auth-rafa", email: "rafa@grimo.test" })
      .query(api.account.exportData, {});
    expect(data.profile).toMatchObject({
      pronouns: "ela/dela",
      profileSong: song,
      favoriteBooks: ["Duna"],
    });

    await t.run((ctx) => onAccountDeleted(ctx, "auth-rafa"));
    const row = await t.run(async (ctx) =>
      ctx.db
        .query("users")
        .withIndex("by_authId", (q) => q.eq("authId", "auth-rafa"))
        .unique(),
    );
    expect(row?.pronouns).toBeUndefined();
    expect(row?.profileSong).toBeUndefined();
    expect(row?.favoriteBookIds).toBeUndefined();
  });
});
