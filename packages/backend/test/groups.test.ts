import { GROUP_MAX_MEMBERS } from "@grimo/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "../convex/_generated/api";
import { newTest, reader } from "./setup";

const book = {
  openLibraryId: "OL7W",
  title: "Torto Arado",
  authors: ["Itamar Vieira Junior"],
  coverUrl: null,
  pageCount: 200,
  publishedYear: 2019,
  genres: [],
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

async function setup() {
  const t = newTest();
  const rafa = await reader(t, "rafa");
  const bia = await reader(t, "bia");
  const { id } = await rafa.as.mutation(api.groups.create, { book, finishBy: null });
  const { inviteCode } = await rafa.as.query(api.groups.detail, { id });
  return { t, rafa, bia, id, inviteCode };
}

const entryOf = async (as: Awaited<ReturnType<typeof reader>>["as"]) =>
  (await as.query(api.shelves.list, {})).items.find((item) => item.book.openLibraryId === "OL7W")
    ?.entry;

describe("juntos", () => {
  it("creates a group, joins by link and puts the book on 'Lendo'", async () => {
    const { rafa, bia, id, inviteCode } = await setup();
    expect((await entryOf(rafa.as))?.status).toBe("reading");

    // Signed out, the invite shows the book and who reads it.
    const preview = await bia.as.query(api.groups.byCode, {
      code: `https://grimo.app/j/${inviteCode}`,
    });
    expect(preview).toMatchObject({
      isMember: false,
      memberCount: 1,
      book: { title: "Torto Arado" },
    });

    // Bia wanted to read it: joining moves it to "Lendo".
    await bia.as.mutation(api.shelves.add, { book, status: "want_to_read" });
    const joined = await bia.as.mutation(api.groups.join, { code: inviteCode });
    expect(joined.id).toBe(id);
    expect((await entryOf(bia.as))?.status).toBe("reading");
    // Joining twice is a no-op.
    await bia.as.mutation(api.groups.join, { code: inviteCode });

    const entry = (await entryOf(bia.as))!;
    await bia.as.mutation(api.shelves.update, { id: entry.id, currentPage: 100 });
    const detail = await rafa.as.query(api.groups.detail, { id });
    expect(detail.members.map((m) => [m.username, m.percent])).toEqual([
      ["bia", 50],
      ["rafa", 0],
    ]);
    expect(detail.groupPercent).toBe(25);
    expect((await rafa.as.query(api.groups.mine, {})).items).toMatchObject([
      { id, memberCount: 2, myPercent: 0, groupPercent: 25 },
    ]);
  });

  it("hides messages written further along than you've read", async () => {
    const { rafa, bia, id, inviteCode } = await setup();
    await bia.as.mutation(api.groups.join, { code: inviteCode });
    const entry = (await entryOf(bia.as))!;
    await bia.as.mutation(api.shelves.update, { id: entry.id, currentPage: 120 });
    await bia.as.mutation(api.groups.send, { id, body: "Que reviravolta no capítulo 8!" });
    await rafa.as.mutation(api.groups.send, { id, body: "Começando hoje" });

    let forRafa = await rafa.as.query(api.groups.messages, { id, limit: 20 });
    expect(forRafa.items.map((m) => [m.percent, m.body])).toEqual([
      [0, "Começando hoje"],
      [60, null],
    ]);

    const mine = (await entryOf(rafa.as))!;
    await rafa.as.mutation(api.shelves.update, { id: mine.id, currentPage: 130 });
    forRafa = await rafa.as.query(api.groups.messages, { id, limit: 20 });
    expect(forRafa.items[1]?.body).toBe("Que reviravolta no capítulo 8!");
  });

  it("is only seen from inside, and refuses blocked readers", async () => {
    const { t, rafa, bia, id, inviteCode } = await setup();
    await expect(bia.as.query(api.groups.detail, { id })).rejects.toThrow(/não encontrado/);
    await expect(bia.as.mutation(api.groups.send, { id, body: "oi" })).rejects.toThrow();

    await rafa.as.mutation(api.moderation.setBlocked, { userId: bia.id, block: true });
    await expect(bia.as.mutation(api.groups.join, { code: inviteCode })).rejects.toThrow(
      /não pode entrar/,
    );
    await expect(bia.as.mutation(api.groups.join, { code: "zzzzzzzz" })).rejects.toThrow(
      /Convite inválido/,
    );

    // Full groups say no.
    await t.run(async (ctx) => {
      await ctx.db.patch(id, { memberCount: GROUP_MAX_MEMBERS });
      for (let i = 1; i < GROUP_MAX_MEMBERS; i++) {
        const userId = await ctx.db.insert("users", {
          authId: `x${i}`,
          name: `x${i}`,
          username: `x${i}`,
          image: null,
          bio: null,
          favoriteGenres: [],
          followers: 0,
          following: 0,
          bookCount: 0,
          searchText: `x${i}`,
        });
        await ctx.db.insert("groupMembers", { groupId: id, userId, joinedAt: i });
      }
    });
    const caio = await reader(t, "caio");
    await expect(caio.as.mutation(api.groups.join, { code: inviteCode })).rejects.toThrow(/já tem/);
  });

  it("hands the group over when the owner leaves, and the last one out deletes it", async () => {
    const { t, rafa, bia, id, inviteCode } = await setup();
    await bia.as.mutation(api.groups.join, { code: inviteCode });
    await rafa.as.mutation(api.groups.send, { id, body: "tchau" });
    await rafa.as.mutation(api.groups.leave, { id });
    const detail = await bia.as.query(api.groups.detail, { id });
    expect(detail).toMatchObject({ isOwner: true, members: [{ username: "bia" }] });

    await bia.as.mutation(api.groups.setFinishBy, { id, finishBy: Date.now() + 86_400_000 });
    await bia.as.mutation(api.groups.leave, { id });
    expect(await t.run((ctx) => ctx.db.get(id))).toBeNull();
    expect(await t.run((ctx) => ctx.db.query("groupMessages").collect())).toEqual([]);
  });

  it("only the owner sets the date or removes people", async () => {
    const { rafa, bia, id, inviteCode } = await setup();
    await bia.as.mutation(api.groups.join, { code: inviteCode });
    await expect(bia.as.mutation(api.groups.setFinishBy, { id, finishBy: null })).rejects.toThrow(
      /Só quem criou/,
    );
    await expect(
      rafa.as.mutation(api.groups.setFinishBy, { id, finishBy: Date.now() - 1000 }),
    ).rejects.toThrow(/futuro/);
    await rafa.as.mutation(api.groups.removeMember, { id, userId: bia.id });
    await expect(bia.as.query(api.groups.detail, { id })).rejects.toThrow();
  });

  it("is in the data export and goes with the account", async () => {
    const { t, rafa, bia, id, inviteCode } = await setup();
    await bia.as.mutation(api.groups.join, { code: inviteCode });
    await bia.as.mutation(api.groups.send, { id, body: "oi" });
    const data = await bia.as.query(api.account.exportData, {});
    expect(data.readingGroups).toMatchObject([{ book: "Torto Arado" }]);
    expect(data.groupMessages).toMatchObject([{ body: "oi", atPercent: 0 }]);

    await t.run((ctx) => ctx.db.patch(bia.id, { deletedAt: Date.now() }));
    await t.mutation(internal.account.purge, { userId: bia.id, step: 0 });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    const detail = await rafa.as.query(api.groups.detail, { id });
    expect(detail.members.map((m) => m.username)).toEqual(["rafa"]);
    expect((await rafa.as.query(api.groups.messages, { id, limit: 20 })).items).toEqual([]);
  });
});
