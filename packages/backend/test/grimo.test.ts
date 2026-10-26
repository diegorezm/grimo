import { PRIVACY_VERSION, TERMS_VERSION } from "@grimo/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "../convex/_generated/api";
import { onAccountDeleted } from "../convex/account";
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

/** What the stubbed Open Library search returns (the network is never used in tests). */
let openLibrary: Record<string, unknown>[] = [];

beforeEach(() => {
  // Scheduled functions only run when a test asks (`finishAllScheduledFunctions`), so none of
  // them leaks into the next test.
  vi.useFakeTimers();
  openLibrary = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ docs: openLibrary }))),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

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

describe("books", () => {
  it("only saves Open Library books, with Open Library covers", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    await expect(
      rafa.as.mutation(api.shelves.add, {
        book: { ...book, openLibraryId: "x" },
        status: "reading",
      }),
    ).rejects.toThrow(/Open Library/);
    await expect(
      rafa.as.mutation(api.shelves.add, {
        book: { ...book, coverUrl: "https://tracker.example/pixel.png" },
        status: "reading",
      }),
    ).rejects.toThrow(/capa/);
    await expect(
      rafa.as.mutation(api.shelves.add, {
        book: { ...book, title: "x".repeat(501) },
        status: "reading",
      }),
    ).rejects.toThrow();
  });

  it("replaces what the first reader sent with Open Library's data", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    openLibrary = [
      {
        key: "/works/OL1W",
        title: "Dune",
        author_name: ["Frank Herbert"],
        cover_i: 42,
        number_of_pages_median: 608,
        first_publish_year: 1965,
        subject: ["Science fiction"],
      },
    ];

    await rafa.as.mutation(api.shelves.add, {
      book: { ...book, title: "Livro falso", authors: ["Ninguém"] },
      status: "reading",
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    // A later reader can't rename it either: existing books only get missing fields filled.
    await bia.as.mutation(api.shelves.add, {
      book: { ...book, title: "Outro falso" },
      status: "want_to_read",
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    const { detail } = await rafa.as.query(api.books.detail, { openLibraryId: "OL1W" });
    expect(detail?.book).toMatchObject({
      title: "Dune",
      authors: ["Frank Herbert"],
      coverUrl: "https://covers.openlibrary.org/b/id/42-L.jpg",
      pageCount: 608,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("keeps the book when Open Library doesn't answer", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("offline"));
    const t = newTest();
    const rafa = await reader(t, "rafa");
    await rafa.as.mutation(api.shelves.add, { book, status: "reading" });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    const { detail } = await rafa.as.query(api.books.detail, { openLibraryId: "OL1W" });
    expect(detail?.book.title).toBe("Duna");
  });

  it("hides reviews of blocked and hidden readers", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    const caio = await reader(t, "caio");
    const { entry } = await bia.as.mutation(api.shelves.add, { book, status: "read" });
    const review = { kind: "review" as const, bookId: entry.bookId, rating: 5 };
    await bia.as.mutation(api.posts.create, { ...review, body: "Da bia" });
    await caio.as.mutation(api.posts.create, { ...review, body: "Do caio" });
    await rafa.as.mutation(api.posts.create, { ...review, body: "Do rafa" });
    const reviews = async (as: typeof rafa.as | typeof t) =>
      (await as.query(api.books.detail, { openLibraryId: "OL1W" })).detail?.reviews.map(
        (item) => item.body,
      );

    expect(await reviews(rafa.as)).toEqual(["Do rafa", "Do caio", "Da bia"]);
    await rafa.as.mutation(api.moderation.setBlocked, { userId: bia.id, block: true });
    // Blocking hides both ways.
    expect(await reviews(rafa.as)).toEqual(["Do rafa", "Do caio"]);
    expect(await reviews(bia.as)).toEqual(["Do caio", "Da bia"]);
    await t.mutation(internal.moderation.suspend, { username: "caio", suspend: true });
    expect(await reviews(rafa.as)).toEqual(["Do rafa"]);
    expect(await reviews(t)).toEqual(["Do rafa", "Da bia"]);
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

/** What the onboarding sends to agree to the current documents. */
const agree = (birthDate: string | null = "2000-01-31") => ({
  accepted: true,
  termsVersion: TERMS_VERSION,
  privacyVersion: PRIVACY_VERSION,
  birthDate: birthDate ?? undefined,
  source: "web" as const,
});

describe("setup", () => {
  it("new accounts confirm name, a free @, their age and the terms", async () => {
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
      fresh.as.mutation(api.users.completeSetup, { name: "Ana", username: "rafa", ...agree() }),
    ).rejects.toThrow(/já tem dono/);
    await expect(
      fresh.as.mutation(api.users.completeSetup, { name: " ", username: "ana", ...agree() }),
    ).rejects.toThrow();
    await expect(
      fresh.as.mutation(api.users.completeSetup, {
        name: "Ana",
        username: "ana",
        ...agree(),
        accepted: false,
      }),
    ).rejects.toThrow(/aceite/);
    await expect(
      fresh.as.mutation(api.users.completeSetup, {
        name: "Ana",
        username: "ana",
        ...agree(),
        termsVersion: "1999-01-01",
      }),
    ).rejects.toThrow(/atualizados/);

    const result = await fresh.as.mutation(api.users.completeSetup, {
      name: "Ana Prado",
      username: "Ana.Prado",
      ...agree(),
    });
    expect(result).toEqual({ ok: true });
    expect(await fresh.as.query(api.users.me, {})).toMatchObject({
      name: "Ana Prado",
      username: "ana.prado",
      needsSetup: false,
      legal: { needsAcceptance: false, needsAge: false, underage: false },
    });
  });

  it("refuses readers under 16 and hides them", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const kid = await reader(t, "kid");
    await t.run((ctx) => ctx.db.patch(kid.id, { setupDone: false }));
    const year = new Date().getUTCFullYear();

    const result = await kid.as.mutation(api.users.completeSetup, {
      name: "Kid",
      username: "kid",
      ...agree(`${year - 10}-01-01`),
    });
    expect(result).toEqual({ ok: false, reason: "underage" });
    expect(await kid.as.query(api.users.me, {})).toMatchObject({
      needsSetup: true,
      legal: { underage: true },
    });
    // Trying again with another date doesn't undo it.
    expect(await kid.as.mutation(api.legal.accept, { ...agree(), source: "ios" })).toEqual({
      ok: false,
      reason: "underage",
    });
    await expect(rafa.as.query(api.users.byUsername, { username: "kid", year })).rejects.toThrow(
      /não encontrado/,
    );
  });

  it("asks older accounts to accept the terms (and their age) again", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    expect((await rafa.as.query(api.users.me, {})).legal).toEqual({
      needsAcceptance: true,
      needsAge: true,
      underage: false,
    });
    await expect(rafa.as.mutation(api.legal.accept, agree(null))).rejects.toThrow(/nascimento/);
    await rafa.as.mutation(api.legal.accept, agree());
    expect((await rafa.as.query(api.users.me, {})).legal).toEqual({
      needsAcceptance: false,
      needsAge: false,
      underage: false,
    });
    const rows = await t.run((ctx) => ctx.db.query("legalAcceptances").collect());
    expect(rows.map((row) => [row.document, row.version, row.source])).toEqual([
      ["terms", TERMS_VERSION, "web"],
      ["privacy", PRIVACY_VERSION, "web"],
    ]);
  });
});

describe("moderation", () => {
  it("blocking undoes follows and hides each other", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    const year = 2026;
    await rafa.as.mutation(api.users.setFollowing, { userId: bia.id, follow: true });
    await bia.as.mutation(api.users.setFollowing, { userId: rafa.id, follow: true });
    const { post } = await bia.as.mutation(api.posts.create, { kind: "note", body: "Oi!" });

    await rafa.as.mutation(api.moderation.setBlocked, { userId: bia.id, block: true });
    expect(await rafa.as.query(api.users.me, {})).toMatchObject({ followers: 0, following: 0 });
    expect(await rafa.as.query(api.moderation.blocked, {})).toMatchObject({
      items: [{ username: "bia" }],
    });
    expect(await rafa.as.query(api.users.byUsername, { username: "bia", year })).toMatchObject({
      blockedByMe: true,
    });
    await expect(bia.as.query(api.users.byUsername, { username: "rafa", year })).rejects.toThrow(
      /não encontrado/,
    );
    await expect(
      bia.as.mutation(api.users.setFollowing, { userId: rafa.id, follow: true }),
    ).rejects.toThrow(/Não é possível/);
    await expect(
      rafa.as.mutation(api.posts.setLiked, { postId: post.id, like: true }),
    ).rejects.toThrow(/Não é possível/);
    await expect(rafa.as.query(api.posts.get, { id: post.id })).rejects.toThrow();

    await rafa.as.mutation(api.moderation.setBlocked, { userId: bia.id, block: false });
    await bia.as.mutation(api.users.setFollowing, { userId: rafa.id, follow: true });
  });

  it("records reports once, with a copy of the content", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    const { post } = await bia.as.mutation(api.posts.create, { kind: "note", body: "Spam!" });
    const report = { target: "post" as const, targetId: post.id, reason: "spam" as const };
    await rafa.as.mutation(api.moderation.report, report);
    await rafa.as.mutation(api.moderation.report, report);
    await expect(bia.as.mutation(api.moderation.report, report)).rejects.toThrow(/seu/);
    await expect(
      rafa.as.mutation(api.moderation.report, { ...report, reason: "other" }),
    ).rejects.toThrow(/aconteceu/);

    const rows = await t.run((ctx) => ctx.db.query("reports").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ targetUserId: bia.id, snapshot: "Spam!", status: "open" });
  });

  it("doesn't pile up reports when an older one was already resolved", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    const { post } = await bia.as.mutation(api.posts.create, { kind: "note", body: "Spam!" });
    const report = { target: "post" as const, targetId: post.id, reason: "spam" as const };
    await rafa.as.mutation(api.moderation.report, report);
    await t.run(async (ctx) => {
      const first = await ctx.db.query("reports").first();
      if (!first) throw new Error("expected a report");
      await ctx.db.patch(first._id, { status: "dismissed", resolvedAt: Date.now() });
    });
    await rafa.as.mutation(api.moderation.report, report);
    await rafa.as.mutation(api.moderation.report, report);
    expect(await t.run((ctx) => ctx.db.query("reports").collect())).toHaveLength(2);
  });

  it("refuses a post about a book that doesn't exist", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bookId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("books", {
        openLibraryId: "OL1W",
        title: "Gone",
        authors: [],
        coverUrl: null,
        pageCount: null,
        publishedYear: null,
        genres: [],
      });
      await ctx.db.delete(id);
      return id;
    });
    await expect(
      rafa.as.mutation(api.posts.create, { kind: "review", bookId, body: "Ótimo" }),
    ).rejects.toThrow();
  });

  it("suggests friends of friends and leaves out who you follow", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    const caio = await reader(t, "caio");
    await reader(t, "dani");
    await rafa.as.mutation(api.users.setFollowing, { userId: bia.id, follow: true });
    await bia.as.mutation(api.users.setFollowing, { userId: caio.id, follow: true });
    const { items } = await rafa.as.query(api.users.suggestions, { limit: 20 });
    const usernames = items.map((item) => item.username);
    expect(usernames).not.toContain("bia");
    expect(usernames).not.toContain("rafa");
    expect(usernames[0]).toBe("caio");
    expect(items[0]).toMatchObject({ mutuals: 1, mutualName: "bia" });
    expect(usernames).toContain("dani");
  });

  it("counts books in the reader's own time zone", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    await rafa.as.mutation(api.users.setTimeZone, { timeZone: "America/Sao_Paulo" });
    await expect(
      rafa.as.mutation(api.users.setTimeZone, { timeZone: "Mars/Olympus" }),
    ).rejects.toThrow();
    // 22:00 on Oct 31 in São Paulo is already November in UTC.
    await t.run(async (ctx) => {
      const bookId = await ctx.db.insert("books", {
        openLibraryId: "OL2W",
        title: "Noite",
        authors: [],
        coverUrl: null,
        pageCount: null,
        publishedYear: null,
        genres: [],
      });
      await ctx.db.insert("shelfEntries", {
        userId: rafa.id,
        bookId,
        status: "read",
        currentPage: 0,
        rating: null,
        startedAt: null,
        finishedAt: Date.parse("2026-11-01T01:00:00Z"),
        updatedAt: Date.now(),
      });
    });
    const october = await rafa.as.query(api.stats.monthly, { month: "2026-10" });
    const november = await rafa.as.query(api.stats.monthly, { month: "2026-11" });
    expect(october.booksRead).toBe(1);
    expect(november.booksRead).toBe(0);
  });

  it("doesn't count the same pages twice after going back", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const { entry } = await rafa.as.mutation(api.shelves.add, {
      book: { ...book, openLibraryId: "OL3W", pageCount: 300 },
      status: "reading",
    });
    for (const page of [200, 100, 150, 230]) {
      await rafa.as.mutation(api.shelves.update, { id: entry.id, currentPage: page });
    }
    const logs = await t.run((ctx) => ctx.db.query("readingLogs").collect());
    expect(logs.reduce((total, log) => total + log.pagesRead, 0)).toBe(230);
  });

  it("suspended readers are hidden and can't use the app", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    await reader(t, "bia");
    await t.mutation(internal.moderation.suspend, { username: "bia", suspend: true });
    await expect(
      rafa.as.query(api.users.byUsername, { username: "bia", year: 2026 }),
    ).rejects.toThrow(/não encontrado/);
    const bia = t.withIdentity({ subject: "auth-bia" });
    await expect(bia.query(api.users.me, {})).rejects.toThrow(/suspensa/);
  });
});

describe("account", () => {
  it("exports the reader's data", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    await rafa.as.mutation(api.shelves.add, { book, status: "reading" });
    await rafa.as.mutation(api.posts.create, { kind: "note", body: "Minha nota" });
    await rafa.as.mutation(api.legal.accept, agree());
    const data = await t
      .withIdentity({ subject: "auth-rafa", email: "rafa@grimo.test" })
      .query(api.account.exportData, {});
    expect(data).toMatchObject({
      account: { email: "rafa@grimo.test" },
      profile: { username: "rafa" },
      shelf: [{ book: "Duna", status: "reading" }],
      posts: [{ body: "Minha nota" }],
    });
    expect(data.legalAcceptances).toHaveLength(2);
  });

  it("deleting an account erases its data and fixes everyone's counters", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    await rafa.as.mutation(api.shelves.add, { book, status: "reading" });
    await rafa.as.mutation(api.users.setFollowing, { userId: bia.id, follow: true });
    await bia.as.mutation(api.users.setFollowing, { userId: rafa.id, follow: true });
    const { post: biaPost } = await bia.as.mutation(api.posts.create, { kind: "note", body: "Oi" });
    await rafa.as.mutation(api.posts.setLiked, { postId: biaPost.id, like: true });
    await rafa.as.mutation(api.posts.comment, { postId: biaPost.id, body: "Legal!" });
    const { post: rafaPost } = await rafa.as.mutation(api.posts.create, {
      kind: "note",
      body: "Tchau",
    });
    await bia.as.mutation(api.posts.setLiked, { postId: rafaPost.id, like: true });
    await bia.as.mutation(api.moderation.report, {
      target: "post",
      targetId: rafaPost.id,
      reason: "spam",
    });

    await t.run((ctx) => onAccountDeleted(ctx, "auth-rafa"));
    // Hidden right away, before the purge runs.
    await expect(
      bia.as.query(api.users.byUsername, { username: "rafa", year: 2026 }),
    ).rejects.toThrow(/não encontrado/);
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    const left = await t.run(async (ctx) => ({
      user: await ctx.db.get(rafa.id),
      bia: await ctx.db.get(bia.id),
      post: await ctx.db.get(biaPost.id),
      follows: await ctx.db.query("follows").collect(),
      shelf: await ctx.db.query("shelfEntries").collect(),
      posts: await ctx.db.query("posts").collect(),
      activities: await ctx.db.query("activities").collect(),
      reports: await ctx.db.query("reports").collect(),
    }));
    expect(left.user).toBeNull();
    expect(left.bia).toMatchObject({ followers: 0, following: 0 });
    expect(left.post).toMatchObject({ likeCount: 0, commentCount: 0 });
    expect(left.follows).toHaveLength(0);
    expect(left.shelf).toHaveLength(0);
    expect(left.posts.map((post) => post.body)).toEqual(["Oi"]);
    expect(left.activities.every((activity) => activity.actorId === bia.id)).toBe(true);
    // The report about the deleted post stays as the moderation record.
    expect(left.reports).toHaveLength(1);
    vi.useRealTimers();
  });
});
