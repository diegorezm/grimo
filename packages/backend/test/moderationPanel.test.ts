import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "../convex/_generated/api";
import { newTest, reader } from "./setup";

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
  const mod = await reader(t, "mod");
  const rafa = await reader(t, "rafa");
  const bia = await reader(t, "bia");
  await t.mutation(internal.moderation.setAdmin, { username: "mod", admin: true });
  return { t, mod, rafa, bia };
}

describe("moderation panel", () => {
  it("is only for the moderation team", async () => {
    const { mod, rafa } = await setup();
    await expect(rafa.as.query(api.moderation.counts, {})).rejects.toThrow(/moderação/);
    expect(await mod.as.query(api.users.me, {})).toMatchObject({ isAdmin: true, isStaff: true });
    expect(await rafa.as.query(api.users.me, {})).toMatchObject({ isAdmin: false, isStaff: false });
    expect(await mod.as.query(api.moderation.counts, {})).toMatchObject({ reports: 0, books: 0 });
  });

  it("removes reported content and closes every report about it", async () => {
    const { mod, rafa, bia, t } = await setup();
    const { post } = await rafa.as.mutation(api.posts.create, { kind: "note", body: "spam!" });
    await bia.as.mutation(api.posts.setLiked, { postId: post.id, like: true });
    await bia.as.mutation(api.moderation.report, {
      target: "post",
      targetId: post.id,
      reason: "spam",
    });
    await mod.as.mutation(api.moderation.report, {
      target: "post",
      targetId: post.id,
      reason: "spam",
    });

    const { items: reports } = await mod.as.query(api.moderation.reports, {
      page: 1,
      pageSize: 20,
    });
    // Both reports are about the same post: one card, with both reporters.
    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({
      target: "post",
      snippet: "spam!",
      reportCount: 2,
      targetUser: { username: "rafa", suspended: false },
    });
    const detail = await mod.as.query(api.moderation.reportDetail, { reportId: reports[0]!.id });
    expect(detail).toMatchObject({
      snapshot: "spam!",
      reporters: [{ reporter: { username: "bia" } }, { reporter: { username: "mod" } }],
      content: { kind: "post", postId: post.id, body: "spam!" },
    });

    await mod.as.mutation(api.moderation.act, { reportId: reports[0]!.id, action: "remove" });
    expect((await mod.as.query(api.moderation.reports, { page: 1, pageSize: 20 })).items).toEqual(
      [],
    );
    expect(await t.run((ctx) => ctx.db.get(post.id))).toBeNull();
    // Its like notification went with it.
    expect((await rafa.as.query(api.notifications.list, { limit: 20 })).items).toEqual([]);
  });

  it("suspends a reader, dismisses reports, and reviews hand-added books", async () => {
    const { mod, rafa, bia } = await setup();
    await bia.as.mutation(api.moderation.report, {
      target: "user",
      targetId: rafa.id,
      reason: "harassment",
    });
    let { items: reports } = await mod.as.query(api.moderation.reports, { page: 1, pageSize: 20 });
    await mod.as.mutation(api.moderation.act, {
      reportId: reports[0]!.id,
      action: "suspend",
      duration: "permanent",
      reason: "assédio",
    });
    await expect(rafa.as.query(api.users.me, {})).rejects.toThrow(/suspensa.*assédio/);

    const { post } = await bia.as.mutation(api.posts.create, { kind: "note", body: "ok" });
    await mod.as.mutation(api.moderation.report, {
      target: "post",
      targetId: post.id,
      reason: "other",
      details: "engano",
    });
    ({ items: reports } = await mod.as.query(api.moderation.reports, { page: 1, pageSize: 20 }));
    await mod.as.mutation(api.moderation.act, { reportId: reports[0]!.id, action: "dismiss" });
    expect((await bia.as.query(api.posts.get, { id: post.id })).post.body).toBe("ok");

    const { openLibraryId } = await bia.as.mutation(api.books.addManual, {
      title: "Contos da Vila",
      authors: ["Fulana"],
      pageCount: null,
      publishedYear: null,
      status: "read",
    });
    const { items: books } = await mod.as.query(api.moderation.books, { page: 1, pageSize: 20 });
    expect(books).toMatchObject([{ openLibraryId, addedBy: { username: "bia" } }]);
    await expect(
      bia.as.mutation(api.moderation.decideBook, { openLibraryId, approve: true }),
    ).rejects.toThrow(/moderação/);
    await mod.as.mutation(api.moderation.decideBook, { openLibraryId, approve: true });
    expect((await mod.as.query(api.moderation.books, { page: 1, pageSize: 20 })).items).toEqual([]);
    const { detail } = await mod.as.query(api.books.detail, { openLibraryId });
    expect(detail?.book.reviewStatus).toBe("approved");
  });
  it("pages reports, books and history by limit, and counts what waits", async () => {
    const { t, mod, rafa, bia } = await setup();
    await t.run(async (ctx) => {
      for (let i = 0; i < 5; i++) {
        await ctx.db.insert("posts", {
          authorId: rafa.id,
          bookId: null,
          kind: "note",
          rating: null,
          body: `spam ${i}`,
          hasSpoilers: false,
          likeCount: 0,
          commentCount: 0,
        });
      }
    });
    const posts = await t.run((ctx) => ctx.db.query("posts").collect());
    for (const post of posts) {
      await bia.as.mutation(api.moderation.report, {
        target: "post",
        targetId: post._id,
        reason: "spam",
      });
    }
    expect(await mod.as.query(api.moderation.counts, {})).toMatchObject({ reports: 5, books: 0 });

    const first = await mod.as.query(api.moderation.reports, { page: 1, pageSize: 2 });
    expect(first).toMatchObject({ total: 5, page: 1, pages: 3, pageSize: 2 });
    expect(first.items).toHaveLength(2);
    const last = await mod.as.query(api.moderation.reports, { page: 3, pageSize: 2 });
    expect(last.items).toHaveLength(1);
    // Asking past the end gives the last page.
    expect(await mod.as.query(api.moderation.reports, { page: 9, pageSize: 2 })).toMatchObject({
      page: 3,
    });

    for (const report of first.items) {
      await mod.as.mutation(api.moderation.act, { reportId: report.id, action: "dismiss" });
    }
    const log = await mod.as.query(api.moderation.log, { page: 2, pageSize: 1 });
    // The admin grant from setup plus the two dismissals.
    expect(log).toMatchObject({ total: 3, pages: 3, page: 2 });
    expect(log.items).toHaveLength(1);
    expect(
      (await mod.as.query(api.moderation.log, { page: 1, pageSize: 5, action: "remove" })).total,
    ).toBe(0);
    expect(await mod.as.query(api.moderation.counts, {})).toMatchObject({ reports: 3 });
  });

  it("groups reports of the same thing and filters, searches and sorts them", async () => {
    const { t, mod, rafa, bia } = await setup();
    const caio = await reader(t, "caio");
    const book = await t.run((ctx) =>
      ctx.db.insert("books", {
        openLibraryId: "OL1W",
        title: "Duna",
        authors: ["Frank Herbert"],
        coverUrl: null,
        pageCount: 600,
        publishedYear: 1965,
        genres: [],
      }),
    );
    const post = (authorId: typeof rafa.id, body: string) =>
      t.run((ctx) =>
        ctx.db.insert("posts", {
          authorId,
          bookId: book,
          kind: "review",
          rating: 2,
          body,
          hasSpoilers: false,
          likeCount: 3,
          commentCount: 1,
        }),
      );
    const spam = await post(rafa.id, "compre seguidores");
    const spoiler = await post(caio.id, "o final de Duna é incrível");
    const file = (from: typeof bia, targetId: string, reason: "spam" | "spoiler") =>
      from.as.mutation(api.moderation.report, { target: "post", targetId, reason });
    await file(bia, spam, "spam");
    await caio.as.mutation(api.moderation.report, {
      target: "post",
      targetId: spam,
      reason: "other",
      details: "parece propaganda",
    });
    vi.advanceTimersByTime(60_000);
    await file(bia, spoiler, "spoiler");

    const page = (extra: Record<string, unknown> = {}) =>
      mod.as.query(api.moderation.reports, { page: 1, pageSize: 10, ...extra });

    // One light card per reported thing; the detail view has the rest.
    const all = await page();
    expect(all.total).toBe(2);
    const card = all.items.find((item) => item.snippet === "compre seguidores")!;
    expect(card).toMatchObject({
      reportCount: 2,
      reasons: ["spam", "other"],
      targetUser: { username: "rafa" },
    });
    expect(card).not.toHaveProperty("content");

    const detail = (await mod.as.query(api.moderation.reportDetail, { reportId: card.id }))!;
    expect(detail).toMatchObject({
      targetId: spam,
      reportCount: 2,
      targetUser: { username: "rafa", history: { reports: 2, open: 2 } },
      content: { kind: "post", body: "compre seguidores", likes: 3, book: { title: "Duna" } },
    });
    expect(detail.reporters.map((r) => r.reporter?.username)).toEqual(["bia", "caio"]);

    const snippets = async (extra: Record<string, unknown>) =>
      (await page(extra)).items.map((item) => item.snippet);
    expect(await snippets({ reason: "spoiler" })).toEqual(["o final de Duna é incrível"]);
    expect(await snippets({ reason: "other" })).toEqual(["compre seguidores"]);
    expect((await page({ target: "comment" })).total).toBe(0);
    expect(await snippets({ search: "@CAIO" })).toEqual(["o final de Duna é incrível"]);
    expect(await snippets({ search: "seguidores" })).toEqual(["compre seguidores"]);
    expect((await snippets({ sort: "most" }))[0]).toBe("compre seguidores");
    expect((await snippets({ sort: "newest" }))[0]).toBe("o final de Duna é incrível");

    // Acting on the card closes every report of the group, and its detail goes away.
    await mod.as.mutation(api.moderation.act, { reportId: card.id, action: "dismiss" });
    expect((await page()).total).toBe(1);
    expect(await mod.as.query(api.moderation.reportDetail, { reportId: card.id })).toBeNull();
    const record = (await page()).items[0]?.targetUser;
    expect(record).toMatchObject({ username: "caio" });
  });

  it("shows a hand-added book's detail, with the adder's record", async () => {
    const { t, mod, rafa, bia } = await setup();
    const { openLibraryId } = await bia.as.mutation(api.books.addManual, {
      title: "Contos da Vila",
      authors: ["Fulana"],
      pageCount: 120,
      publishedYear: 2020,
      status: "read",
    });
    await t.mutation(internal.moderation.setModerator, { username: "rafa", moderator: true });
    const detail = (await rafa.as.query(api.moderation.bookReview, { openLibraryId }))!;
    expect(detail).toMatchObject({
      title: "Contos da Vila",
      pageCount: 120,
      addedBy: { username: "bia" },
      theirBooks: { total: 1, pending: 1, approved: 0 },
    });
    await mod.as.mutation(api.moderation.decideBook, { openLibraryId, approve: true });
    expect(await rafa.as.query(api.moderation.bookReview, { openLibraryId })).toBeNull();
  });
});

describe("moderators", () => {
  async function team() {
    const { t, mod: admin, rafa, bia } = await setup();
    const moderator = await reader(t, "moderadora");
    await t.mutation(internal.moderation.setModerator, { username: "moderadora", moderator: true });
    return { t, admin, moderator, rafa, bia };
  }

  async function reportUser(from: Awaited<ReturnType<typeof reader>>, userId: string) {
    await from.as.mutation(api.moderation.report, {
      target: "user",
      targetId: userId,
      reason: "spam",
    });
  }

  it("works the queue but can't hand out roles or suspend for good", async () => {
    const { admin, moderator, rafa, bia } = await team();
    expect(await moderator.as.query(api.users.me, {})).toMatchObject({
      isAdmin: false,
      isStaff: true,
    });
    await reportUser(bia, rafa.id);
    const { items: reports } = await moderator.as.query(api.moderation.reports, {
      page: 1,
      pageSize: 20,
    });
    expect(reports).toHaveLength(1);

    await expect(moderator.as.query(api.moderation.log, { page: 1, pageSize: 20 })).rejects.toThrow(
      /admins/,
    );
    await expect(
      moderator.as.mutation(api.moderation.act, {
        reportId: reports[0]!.id,
        action: "suspend",
        duration: "permanent",
        reason: "x",
      }),
    ).rejects.toThrow(/admins/);
    await expect(
      moderator.as.mutation(api.moderation.act, {
        reportId: reports[0]!.id,
        action: "suspend",
        duration: 7,
      }),
    ).rejects.toThrow(/motivo/);

    await moderator.as.mutation(api.moderation.act, {
      reportId: reports[0]!.id,
      action: "suspend",
      duration: 7,
      reason: "spam repetido",
    });
    const { items } = await admin.as.query(api.moderation.log, { page: 1, pageSize: 20 });
    expect(items[0]).toMatchObject({
      action: "suspend",
      actor: { username: "moderadora" },
      targetUser: { username: "rafa" },
    });
  });

  it("lifts a temporary suspension when it ends", async () => {
    const { moderator, rafa, bia } = await team();
    await reportUser(bia, rafa.id);
    const { items: reports } = await moderator.as.query(api.moderation.reports, {
      page: 1,
      pageSize: 20,
    });
    await moderator.as.mutation(api.moderation.act, {
      reportId: reports[0]!.id,
      action: "suspend",
      duration: 1,
      reason: "calma",
    });
    await expect(rafa.as.query(api.users.me, {})).rejects.toThrow(/suspensa até/);
    vi.advanceTimersByTime(25 * 60 * 60 * 1000);
    await expect(rafa.as.query(api.users.me, {})).resolves.toMatchObject({ username: "rafa" });
  });

  it("keeps the team out of reach of moderators, and hides their reports", async () => {
    const { admin, moderator, bia } = await team();
    await reportUser(bia, admin.id);
    await reportUser(bia, moderator.id);
    expect(
      (await moderator.as.query(api.moderation.reports, { page: 1, pageSize: 20 })).items,
    ).toEqual([]);
    const { items: reports } = await admin.as.query(api.moderation.reports, {
      page: 1,
      pageSize: 20,
    });
    expect(reports).toHaveLength(2);
    const ofAdmin = reports.find((report) => report.targetUser?.username === "mod")!;
    const ofModerator = reports.find((report) => report.targetUser?.username === "moderadora")!;
    expect(ofAdmin.targetUser?.canAct).toBe(false);
    expect(ofModerator.targetUser?.canAct).toBe(true);
    await expect(
      moderator.as.mutation(api.moderation.act, { reportId: ofAdmin.id, action: "dismiss" }),
    ).rejects.toThrow(/não pode/);
    await expect(
      admin.as.mutation(api.moderation.act, {
        reportId: ofAdmin.id,
        action: "suspend",
        duration: 7,
        reason: "x",
      }),
    ).rejects.toThrow(/não pode/);
    // An admin may still close a report about themselves, and suspend a moderator.
    await admin.as.mutation(api.moderation.act, { reportId: ofAdmin.id, action: "dismiss" });
    await admin.as.mutation(api.moderation.act, {
      reportId: ofModerator.id,
      action: "suspend",
      duration: 30,
      reason: "abuso do papel",
    });
  });
});
