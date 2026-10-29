import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, type QueryCtx, query } from "./_generated/server";
import { appError, notFound } from "./model/errors";
import { logAction } from "./model/moderation";
import { authorOf, requireAdmin, requireViewer, userByUsername } from "./model/readers";
import { isHidden } from "./model/safety";

// The moderation team: admins invite a specific reader, who has 24 h to accept (`/admin` opens
// for them once they do). Admins are set from the CLI (`moderation:setAdmin`).

/** How long an invite can be accepted. */
const INVITE_TTL = 24 * 60 * 60 * 1000;
/** People shown in the team panel. */
const TEAM_SIZE = 100;

/** Whether an invite can still be answered: pending and not past `expiresAt`. */
const isLive = (invite: Doc<"moderatorInvites">, now: number) =>
  invite.status === "pending" && invite.expiresAt > now;

async function liveInviteFor(ctx: QueryCtx, userId: Doc<"users">["_id"]) {
  const now = Date.now();
  const pending = await ctx.db
    .query("moderatorInvites")
    .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "pending"))
    .take(10);
  return pending.find((invite) => isLive(invite, now)) ?? null;
}

/** Invites a reader to moderate; they have 24 h to accept. Admins only. */
export const invite = mutation({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const admin = await requireAdmin(ctx);
    const user = await userByUsername(ctx, username.trim().replace(/^@/, "").toLowerCase());
    if (!user || isHidden(user)) throw notFound("Leitor");
    if (user.role) throw appError("INVALID", "Essa pessoa já faz parte da moderação.");
    const now = Date.now();
    const pending = await ctx.db
      .query("moderatorInvites")
      .withIndex("by_user_status", (q) => q.eq("userId", user._id).eq("status", "pending"))
      .take(10);
    if (pending.some((item) => isLive(item, now))) {
      throw appError("INVALID", "Essa pessoa já tem um convite aberto.");
    }
    for (const stale of pending) {
      await ctx.db.patch(stale._id, { status: "expired", respondedAt: now });
    }
    await ctx.db.insert("moderatorInvites", {
      userId: user._id,
      invitedBy: admin._id,
      status: "pending",
      createdAt: now,
      expiresAt: now + INVITE_TTL,
      respondedAt: null,
    });
    return null;
  },
});

/** The viewer's own open invite, if any (the banner that asks them to accept). */
export const myInvite = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    if (viewer.role) return null;
    const invite = await liveInviteFor(ctx, viewer._id);
    if (!invite) return null;
    const inviter = invite.invitedBy ? await ctx.db.get(invite.invitedBy) : null;
    return {
      id: invite._id,
      expiresAt: invite.expiresAt,
      invitedBy: inviter ? authorOf(inviter) : null,
    };
  },
});

/** Accepts (the moderator role starts now) or declines the viewer's own invite. */
export const respond = mutation({
  args: { inviteId: v.id("moderatorInvites"), accept: v.boolean() },
  handler: async (ctx, { inviteId, accept }) => {
    const viewer = await requireViewer(ctx);
    const invite = await ctx.db.get(inviteId);
    if (!invite || invite.userId !== viewer._id) throw notFound("Convite");
    if (!isLive(invite, Date.now())) throw appError("INVALID", "Esse convite não vale mais.");
    await ctx.db.patch(invite._id, {
      status: accept ? "accepted" : "declined",
      respondedAt: Date.now(),
    });
    if (accept && !viewer.role) {
      await ctx.db.patch(viewer._id, { role: "moderator" });
      const inviter = invite.invitedBy ? await ctx.db.get(invite.invitedBy) : null;
      await logAction(ctx, inviter, "role_grant", {
        targetUserId: viewer._id,
        details: "moderator (convite aceito)",
      });
    }
    return null;
  },
});

/** Withdraws an invite that is still open. Admins only. */
export const revoke = mutation({
  args: { inviteId: v.id("moderatorInvites") },
  handler: async (ctx, { inviteId }) => {
    await requireAdmin(ctx);
    const invite = await ctx.db.get(inviteId);
    if (invite?.status !== "pending") throw notFound("Convite");
    await ctx.db.patch(invite._id, { status: "revoked", respondedAt: Date.now() });
    return null;
  },
});

/** Takes the moderator role from someone. Admins only (admins themselves go by the CLI). */
export const removeModerator = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const admin = await requireAdmin(ctx);
    const user = await ctx.db.get(userId);
    if (user?.role !== "moderator") throw notFound("Moderador");
    await ctx.db.patch(user._id, { role: undefined });
    await logAction(ctx, admin, "role_revoke", { targetUserId: user._id, details: "moderator" });
    return null;
  },
});

/** A moderator steps down. */
export const leave = mutation({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    if (viewer.role !== "moderator") throw appError("INVALID", "Você não é moderador.");
    await ctx.db.patch(viewer._id, { role: undefined });
    await logAction(ctx, viewer, "role_revoke", {
      targetUserId: viewer._id,
      details: "moderator (saiu)",
    });
    return null;
  },
});

/** Moderators and open invites (admins only). */
export const team = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const [moderators, pending] = await Promise.all([
      ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", "moderator"))
        .take(TEAM_SIZE),
      ctx.db
        .query("moderatorInvites")
        .withIndex("by_status_created", (q) => q.eq("status", "pending"))
        .take(TEAM_SIZE),
    ]);
    const invites = await Promise.all(
      pending
        .filter((invite) => isLive(invite, now))
        .map(async (invite) => {
          const [user, inviter] = await Promise.all([
            ctx.db.get(invite.userId),
            invite.invitedBy ? ctx.db.get(invite.invitedBy) : null,
          ]);
          return {
            id: invite._id,
            expiresAt: invite.expiresAt,
            user: user ? authorOf(user) : null,
            invitedBy: inviter ? authorOf(inviter) : null,
          };
        }),
    );
    return {
      moderators: moderators.filter((user) => !user.deletedAt).map(authorOf),
      invites,
    };
  },
});
