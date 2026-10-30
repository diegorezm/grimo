import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "../convex/_generated/api";
import { newTest, reader } from "./setup";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const HOUR = 60 * 60 * 1000;

async function setup() {
  const t = newTest();
  const admin = await reader(t, "admin");
  const ana = await reader(t, "ana");
  const rafa = await reader(t, "rafa");
  await t.mutation(internal.moderation.setAdmin, { username: "admin", admin: true });
  return { t, admin, ana, rafa };
}

describe("moderator invites", () => {
  it("is for admins only, and only for one account at a time", async () => {
    const { admin, ana, rafa } = await setup();
    await expect(ana.as.mutation(api.moderators.invite, { username: "rafa" })).rejects.toThrow(
      /admins/,
    );
    await expect(admin.as.mutation(api.moderators.invite, { username: "ninguem" })).rejects.toThrow(
      /não encontrad/i,
    );
    await admin.as.mutation(api.moderators.invite, { username: "@Ana" });
    await expect(admin.as.mutation(api.moderators.invite, { username: "ana" })).rejects.toThrow(
      /convite aberto/,
    );
    expect(await rafa.as.query(api.moderators.myInvite, {})).toBeNull();
    expect(await ana.as.query(api.moderators.myInvite, {})).toMatchObject({
      invitedBy: { username: "admin" },
    });
    await expect(admin.as.mutation(api.moderators.invite, { username: "admin" })).rejects.toThrow(
      /já faz parte/,
    );
  });

  it("accepting makes a moderator and logs it; the invite is theirs alone", async () => {
    const { admin, ana, rafa } = await setup();
    await admin.as.mutation(api.moderators.invite, { username: "ana" });
    const invite = (await ana.as.query(api.moderators.myInvite, {}))!;

    await expect(
      rafa.as.mutation(api.moderators.respond, { inviteId: invite.id, accept: true }),
    ).rejects.toThrow(/não encontrad/i);
    await expect(ana.as.query(api.moderation.counts, {})).rejects.toThrow(/moderação/);

    await ana.as.mutation(api.moderators.respond, { inviteId: invite.id, accept: true });
    expect(await ana.as.query(api.users.me, {})).toMatchObject({ isStaff: true, isAdmin: false });
    expect(await ana.as.query(api.moderation.counts, {})).toMatchObject({ reports: 0, books: 0 });
    expect(await ana.as.query(api.moderators.myInvite, {})).toBeNull();
    await expect(
      ana.as.mutation(api.moderators.respond, { inviteId: invite.id, accept: true }),
    ).rejects.toThrow(/não vale mais/);

    const { items } = await admin.as.query(api.moderation.log, { page: 1, pageSize: 20 });
    expect(items[0]).toMatchObject({
      action: "role_grant",
      actor: { username: "admin" },
      targetUser: { username: "ana" },
    });
    const team = await admin.as.query(api.moderators.team, {});
    expect(team.moderators.map((reader) => reader.username)).toEqual(["ana"]);
    expect(team.invites).toEqual([]);
  });

  it("expires after 24 hours and can be sent again", async () => {
    const { admin, ana } = await setup();
    await admin.as.mutation(api.moderators.invite, { username: "ana" });
    const invite = (await ana.as.query(api.moderators.myInvite, {}))!;

    vi.advanceTimersByTime(23 * HOUR);
    expect(await ana.as.query(api.moderators.myInvite, {})).not.toBeNull();
    vi.advanceTimersByTime(2 * HOUR);
    expect(await ana.as.query(api.moderators.myInvite, {})).toBeNull();
    expect((await admin.as.query(api.moderators.team, {})).invites).toEqual([]);
    await expect(
      ana.as.mutation(api.moderators.respond, { inviteId: invite.id, accept: true }),
    ).rejects.toThrow(/não vale mais/);
    await expect(ana.as.query(api.moderation.counts, {})).rejects.toThrow(/moderação/);

    await admin.as.mutation(api.moderators.invite, { username: "ana" });
    expect(await ana.as.query(api.moderators.myInvite, {})).not.toBeNull();
  });

  it("can be declined or withdrawn", async () => {
    const { admin, ana, rafa } = await setup();
    await admin.as.mutation(api.moderators.invite, { username: "ana" });
    const invite = (await ana.as.query(api.moderators.myInvite, {}))!;
    await ana.as.mutation(api.moderators.respond, { inviteId: invite.id, accept: false });
    expect(await ana.as.query(api.users.me, {})).toMatchObject({ isStaff: false });

    await admin.as.mutation(api.moderators.invite, { username: "rafa" });
    const [open] = (await admin.as.query(api.moderators.team, {})).invites;
    expect(open).toMatchObject({ user: { username: "rafa" } });
    await admin.as.mutation(api.moderators.revoke, { inviteId: open!.id });
    expect(await rafa.as.query(api.moderators.myInvite, {})).toBeNull();
  });

  it("lets an admin remove a moderator, and a moderator step down", async () => {
    const { t, admin, ana, rafa } = await setup();
    await t.mutation(internal.moderation.setModerator, { username: "ana", moderator: true });
    await t.mutation(internal.moderation.setModerator, { username: "rafa", moderator: true });
    await expect(
      ana.as.mutation(api.moderators.removeModerator, { userId: rafa.id }),
    ).rejects.toThrow(/admins/);
    await admin.as.mutation(api.moderators.removeModerator, { userId: rafa.id });
    expect(await rafa.as.query(api.users.me, {})).toMatchObject({ isStaff: false });
    await ana.as.mutation(api.moderators.leave, {});
    expect(await ana.as.query(api.users.me, {})).toMatchObject({ isStaff: false });
    await expect(admin.as.mutation(api.moderators.leave, {})).rejects.toThrow(/não é moderador/);
  });
});
