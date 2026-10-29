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
    await expect(rafa.as.query(api.moderation.queue, {})).rejects.toThrow(/moderação/);
    expect((await mod.as.query(api.users.me, {})).isAdmin).toBe(true);
    expect((await rafa.as.query(api.users.me, {})).isAdmin).toBe(false);
    expect(await mod.as.query(api.moderation.queue, {})).toEqual({ reports: [], books: [] });
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

    const { reports } = await mod.as.query(api.moderation.queue, {});
    expect(reports).toHaveLength(2);
    expect(reports[0]).toMatchObject({
      target: "post",
      snapshot: "spam!",
      reporter: { username: "bia" },
      targetUser: { username: "rafa", suspended: false },
      location: { postId: post.id },
    });

    await mod.as.mutation(api.moderation.act, { reportId: reports[0]!.id, action: "remove" });
    expect((await mod.as.query(api.moderation.queue, {})).reports).toEqual([]);
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
    let { reports } = await mod.as.query(api.moderation.queue, {});
    await mod.as.mutation(api.moderation.act, { reportId: reports[0]!.id, action: "suspend" });
    await expect(rafa.as.query(api.users.me, {})).rejects.toThrow(/suspensa/);

    const { post } = await bia.as.mutation(api.posts.create, { kind: "note", body: "ok" });
    await mod.as.mutation(api.moderation.report, {
      target: "post",
      targetId: post.id,
      reason: "other",
      details: "engano",
    });
    ({ reports } = await mod.as.query(api.moderation.queue, {}));
    await mod.as.mutation(api.moderation.act, { reportId: reports[0]!.id, action: "dismiss" });
    expect((await bia.as.query(api.posts.get, { id: post.id })).post.body).toBe("ok");

    const { openLibraryId } = await bia.as.mutation(api.books.addManual, {
      title: "Contos da Vila",
      authors: ["Fulana"],
      pageCount: null,
      publishedYear: null,
      status: "read",
    });
    const { books } = await mod.as.query(api.moderation.queue, {});
    expect(books).toMatchObject([{ openLibraryId, addedBy: { username: "bia" } }]);
    await expect(
      bia.as.mutation(api.moderation.decideBook, { openLibraryId, approve: true }),
    ).rejects.toThrow(/moderação/);
    await mod.as.mutation(api.moderation.decideBook, { openLibraryId, approve: true });
    expect((await mod.as.query(api.moderation.queue, {})).books).toEqual([]);
    const { detail } = await mod.as.query(api.books.detail, { openLibraryId });
    expect(detail?.book.reviewStatus).toBe("approved");
  });
});
