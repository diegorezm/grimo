import {
  type BookInput,
  editionPages,
  GROUP_MAX_MEMBERS,
  memberPercent,
  newInviteCode,
} from "@grimo/core";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { appError, notFound } from "./errors";
import { authorOf } from "./readers";
import { isBlockedBetween, isHidden } from "./safety";
import { addToShelf, updateShelfEntry } from "./shelves";

type Ctx = QueryCtx | MutationCtx;

export const membershipOf = (ctx: Ctx, groupId: Id<"groups">, userId: Id<"users">) =>
  ctx.db
    .query("groupMembers")
    .withIndex("by_group_user", (q) => q.eq("groupId", groupId).eq("userId", userId))
    .unique();

/** The group, if `userId` is in it. Others get "not found": a group is only seen from inside. */
export async function requireMember(ctx: Ctx, groupId: Id<"groups">, userId: Id<"users">) {
  const [group, membership] = await Promise.all([
    ctx.db.get(groupId),
    membershipOf(ctx, groupId, userId),
  ]);
  if (!group || !membership) throw notFound("Grupo");
  return group;
}

export const groupByCode = (ctx: Ctx, code: string) =>
  ctx.db
    .query("groups")
    .withIndex("by_inviteCode", (q) => q.eq("inviteCode", code))
    .unique();

export const membersOf = (ctx: Ctx, groupId: Id<"groups">) =>
  ctx.db
    .query("groupMembers")
    .withIndex("by_group", (q) => q.eq("groupId", groupId))
    .take(GROUP_MAX_MEMBERS + 5);

/** Where `userId` is in the book: percent (for the group and the spoiler gate) and pages. */
export async function progressOf(ctx: Ctx, userId: Id<"users">, book: Doc<"books">) {
  const entry = await ctx.db
    .query("shelfEntries")
    .withIndex("by_user_book", (q) => q.eq("userId", userId).eq("bookId", book._id))
    .unique();
  return {
    percent: memberPercent(entry, book.pageCount),
    currentPage: entry?.currentPage ?? 0,
    pages: editionPages(entry?.pageCount, book.pageCount),
  };
}

/**
 * Members as the viewer sees them, furthest first: hidden readers and readers the viewer
 * blocked (or who blocked the viewer) are left out.
 */
export async function memberViews(
  ctx: Ctx,
  group: Doc<"groups">,
  book: Doc<"books">,
  viewerId: Id<"users"> | null,
  blocked: Set<Id<"users">>,
) {
  const rows = await membersOf(ctx, group._id);
  const views = await Promise.all(
    rows.map(async (row) => {
      const user = await ctx.db.get(row.userId);
      if (!user || isHidden(user) || blocked.has(user._id)) return null;
      return {
        ...authorOf(user),
        ...(await progressOf(ctx, user._id, book)),
        isYou: user._id === viewerId,
        isOwner: user._id === group.ownerId,
        joinedAt: row.joinedAt,
      };
    }),
  );
  return views
    .filter((view) => view !== null)
    .sort((a, b) => b.percent - a.percent || a.joinedAt - b.joinedAt);
}

const bookInputOf = (book: Doc<"books">): BookInput => ({
  openLibraryId: book.openLibraryId,
  title: book.title,
  authors: book.authors,
  coverUrl: book.coverUrl,
  pageCount: book.pageCount,
  publishedYear: book.publishedYear,
  genres: book.genres,
});

/** The group's book goes to "Lendo" (a book already being read or read stays as it is). */
export async function ensureReading(
  ctx: MutationCtx,
  userId: Id<"users">,
  book: Doc<"books">,
  now: number,
) {
  const entry = await ctx.db
    .query("shelfEntries")
    .withIndex("by_user_book", (q) => q.eq("userId", userId).eq("bookId", book._id))
    .unique();
  if (!entry) return addToShelf(ctx, userId, { book: bookInputOf(book), status: "reading" }, now);
  if (entry.status === "reading" || entry.status === "read") return entry;
  return updateShelfEntry(ctx, userId, entry._id, { status: "reading" }, now);
}

/** A code no other group has. */
export async function freeInviteCode(ctx: MutationCtx) {
  const random = () => crypto.getRandomValues(new Uint32Array(1))[0]! / 2 ** 32;
  for (;;) {
    const code = newInviteCode(random);
    if (!(await groupByCode(ctx, code))) return code;
  }
}

/** Adds `user` to the group (full groups and blocks between members say no). */
export async function joinGroup(ctx: MutationCtx, user: Doc<"users">, group: Doc<"groups">) {
  if (await membershipOf(ctx, group._id, user._id)) return;
  const members = await membersOf(ctx, group._id);
  if (members.length >= GROUP_MAX_MEMBERS) {
    throw appError("INVALID", `Este grupo já tem ${GROUP_MAX_MEMBERS} pessoas.`);
  }
  for (const member of members) {
    if (await isBlockedBetween(ctx, user._id, member.userId)) {
      throw appError("FORBIDDEN", "Você não pode entrar neste grupo.");
    }
  }
  await ctx.db.insert("groupMembers", {
    groupId: group._id,
    userId: user._id,
    joinedAt: Date.now(),
  });
  await ctx.db.patch(group._id, { memberCount: members.length + 1 });
}

/**
 * Takes `userId` out of the group. The last one out deletes it (with the conversation); an owner
 * who leaves hands the group to the earliest member.
 */
export async function leaveGroup(ctx: MutationCtx, group: Doc<"groups">, userId: Id<"users">) {
  const membership = await membershipOf(ctx, group._id, userId);
  if (!membership) return;
  await ctx.db.delete(membership._id);
  const rest = await membersOf(ctx, group._id);
  if (rest.length === 0) {
    const messages = await ctx.db
      .query("groupMessages")
      .withIndex("by_group_created", (q) => q.eq("groupId", group._id))
      .collect();
    for (const message of messages) await ctx.db.delete(message._id);
    await ctx.db.delete(group._id);
    return;
  }
  await ctx.db.patch(group._id, {
    memberCount: rest.length,
    ...(group.ownerId === userId && { ownerId: rest[0]!.userId }),
  });
}
