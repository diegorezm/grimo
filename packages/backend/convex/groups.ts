import {
  addToShelfSchema,
  canSeeMessage,
  createGroupSchema,
  groupMessageSchema,
  groupPercent,
  isManualBookId,
  parseInviteCode,
  updateGroupSchema,
} from "@grimo/core";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { appError, notFound, parse } from "./model/errors";
import {
  ensureReading,
  freeInviteCode,
  groupByCode,
  joinGroup,
  leaveGroup,
  membershipOf,
  memberViews,
  progressOf,
  requireMember,
} from "./model/groups";
import { listLimit } from "./model/limits";
import { enforceRateLimit } from "./model/rateLimit";
import { authorOf, getViewer, requireVerifiedViewer, requireViewer } from "./model/readers";
import { blockedIds, isHidden } from "./model/safety";
import { addToShelf, bookByOpenLibraryId, bookView, entryView } from "./model/shelves";
import { bookInput } from "./schema";

/** Groups listed in the Juntos tab (most recent conversation first). */
const MAX_GROUPS = 50;
/** Faces shown on a group card or an invite. */
const PREVIEW_MEMBERS = 6;

/** Your groups: the book, who is in it and how far you and the group are. */
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const [rows, blocked] = await Promise.all([
      ctx.db
        .query("groupMembers")
        .withIndex("by_user", (q) => q.eq("userId", viewer._id))
        .order("desc")
        .take(MAX_GROUPS),
      blockedIds(ctx, viewer._id),
    ]);
    const items = await Promise.all(
      rows.map(async (row) => {
        const group = await ctx.db.get(row.groupId);
        const book = group ? await ctx.db.get(group.bookId) : null;
        if (!group || !book) return null;
        const members = await memberViews(ctx, group, book, viewer._id, blocked);
        const me = members.find((member) => member.isYou);
        return {
          id: group._id,
          book: bookView(book),
          finishBy: group.finishBy,
          memberCount: group.memberCount,
          others: members.filter((member) => !member.isYou).slice(0, PREVIEW_MEMBERS),
          myPercent: me?.percent ?? 0,
          groupPercent: groupPercent(members.map((member) => member.percent)),
          lastActivityAt: group.lastMessageAt ?? row.joinedAt,
        };
      }),
    );
    return {
      items: items
        .filter((item) => item !== null)
        .sort((a, b) => b.lastActivityAt - a.lastActivityAt),
    };
  },
});

/** A group from inside: everyone's progress side by side, the date and the invite. */
export const detail = query({
  args: { id: v.id("groups") },
  handler: async (ctx, { id }) => {
    const viewer = await requireViewer(ctx);
    const group = await requireMember(ctx, id, viewer._id);
    const book = await ctx.db.get(group.bookId);
    if (!book) throw notFound("Grupo");
    const [members, entry] = await Promise.all([
      memberViews(ctx, group, book, viewer._id, await blockedIds(ctx, viewer._id)),
      ctx.db
        .query("shelfEntries")
        .withIndex("by_user_book", (q) => q.eq("userId", viewer._id).eq("bookId", book._id))
        .unique(),
    ]);
    return {
      id: group._id,
      inviteCode: group.inviteCode,
      finishBy: group.finishBy,
      createdAt: group.createdAt,
      isOwner: group.ownerId === viewer._id,
      book: bookView(book),
      members,
      groupPercent: groupPercent(members.map((member) => member.percent)),
      /** Your shelf entry for the book (to log pages right here). */
      entry: entry ? entryView(entry) : null,
    };
  },
});

/**
 * What an invite link shows, signed in or not: the book, who is reading and how far. Null when
 * the code is wrong (or the group is gone).
 */
export const byCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const code = parseInviteCode(args.code);
    const group = code ? await groupByCode(ctx, code) : null;
    const book = group ? await ctx.db.get(group.bookId) : null;
    if (!group || !book) return null;
    const viewer = await getViewer(ctx);
    const [members, membership] = await Promise.all([
      memberViews(
        ctx,
        group,
        book,
        viewer?._id ?? null,
        await blockedIds(ctx, viewer?._id ?? null),
      ),
      viewer ? membershipOf(ctx, group._id, viewer._id) : null,
    ]);
    return {
      id: group._id,
      book: bookView(book),
      finishBy: group.finishBy,
      memberCount: group.memberCount,
      members: members.slice(0, PREVIEW_MEMBERS).map((member) => ({
        id: member.id,
        name: member.name,
        username: member.username,
        image: member.image,
        percent: member.percent,
      })),
      groupPercent: groupPercent(members.map((member) => member.percent)),
      isMember: membership !== null,
    };
  },
});

/** Starts reading `book` with others: the book goes to "Lendo" and the group gets an invite. */
export const create = mutation({
  args: { book: bookInput, finishBy: v.union(v.number(), v.null()) },
  handler: async (ctx, args) => {
    // Like posting: a group (and its invite link) needs a verified email. Joining doesn't, so a
    // new account that came from an invite lands in the group during the onboarding.
    const viewer = await requireVerifiedViewer(ctx);
    const { book: input } = parse(addToShelfSchema, { book: args.book, status: "reading" });
    const { finishBy } = parse(createGroupSchema, { finishBy: args.finishBy });
    await enforceRateLimit(ctx, "createGroup", viewer._id);
    const now = Date.now();

    let book = await bookByOpenLibraryId(ctx, input.openLibraryId);
    // Its invite is public: a hand-added book has to be approved first.
    if (isManualBookId(input.openLibraryId) && book?.reviewStatus !== "approved") {
      throw appError(
        "INVALID",
        "Esse livro ainda está em revisão. Dá para ler junto depois que for aprovado.",
      );
    }
    if (!book) {
      await addToShelf(ctx, viewer._id, { book: input, status: "reading" }, now);
      book = (await bookByOpenLibraryId(ctx, input.openLibraryId))!;
      // Like `shelves.add`: Open Library has the last word on a new book.
      await ctx.scheduler.runAfter(0, internal.books.refreshBook, {
        openLibraryId: input.openLibraryId,
      });
    } else {
      await ensureReading(ctx, viewer._id, book, now);
    }

    const id = await ctx.db.insert("groups", {
      bookId: book._id,
      ownerId: viewer._id,
      inviteCode: await freeInviteCode(ctx),
      finishBy,
      memberCount: 1,
      createdAt: now,
      lastMessageAt: null,
    });
    await ctx.db.insert("groupMembers", { groupId: id, userId: viewer._id, joinedAt: now });
    return { id };
  },
});

/** Joins by invite code (or link); the book goes to your "Lendo" shelf. */
export const join = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const code = parseInviteCode(args.code);
    const group = code ? await groupByCode(ctx, code) : null;
    const book = group ? await ctx.db.get(group.bookId) : null;
    if (!group || !book) throw appError("NOT_FOUND", "Convite inválido ou expirado.");
    await joinGroup(ctx, viewer, group);
    const entry = await ensureReading(ctx, viewer._id, book, Date.now());
    return { id: group._id, entryId: entry._id, book: bookView(book) };
  },
});

export const leave = mutation({
  args: { id: v.id("groups") },
  handler: async (ctx, { id }) => {
    const viewer = await requireViewer(ctx);
    const group = await requireMember(ctx, id, viewer._id);
    await leaveGroup(ctx, group, viewer._id);
    return null;
  },
});

/** The owner takes someone out (they can come back only with the invite). */
export const removeMember = mutation({
  args: { id: v.id("groups"), userId: v.id("users") },
  handler: async (ctx, { id, userId }) => {
    const viewer = await requireViewer(ctx);
    const group = await requireMember(ctx, id, viewer._id);
    if (group.ownerId !== viewer._id) throw appError("FORBIDDEN", "Só quem criou o grupo pode.");
    if (userId === viewer._id) throw appError("INVALID", "Para sair, use “Sair do grupo”.");
    await leaveGroup(ctx, group, userId);
    return null;
  },
});

/** "Terminar até": set or clear the group's date (owner only). */
export const setFinishBy = mutation({
  args: { id: v.id("groups"), finishBy: v.union(v.number(), v.null()) },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const group = await requireMember(ctx, args.id, viewer._id);
    if (group.ownerId !== viewer._id) throw appError("FORBIDDEN", "Só quem criou o grupo pode.");
    const { finishBy } = parse(updateGroupSchema, { finishBy: args.finishBy });
    await ctx.db.patch(group._id, { finishBy });
    return null;
  },
});

/**
 * The conversation, newest first. A message written further along than you've read comes
 * without its text (`body: null`) until you get there.
 */
export const messages = query({
  args: { id: v.id("groups"), limit: v.number() },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const group = await requireMember(ctx, args.id, viewer._id);
    const book = await ctx.db.get(group.bookId);
    if (!book) throw notFound("Grupo");
    const limit = listLimit(args.limit);
    const [rows, blocked, me] = await Promise.all([
      ctx.db
        .query("groupMessages")
        .withIndex("by_group_created", (q) => q.eq("groupId", group._id))
        .order("desc")
        .take(limit + 1),
      blockedIds(ctx, viewer._id),
      progressOf(ctx, viewer._id, book),
    ]);
    const items = await Promise.all(
      rows.slice(0, limit).map(async (row) => {
        const author = await ctx.db.get(row.authorId);
        if (!author || isHidden(author) || blocked.has(author._id)) return null;
        const mine = author._id === viewer._id;
        const open = mine || canSeeMessage(row.percent, me.percent);
        return {
          id: row._id,
          author: authorOf(author),
          mine,
          percent: row.percent,
          body: open ? row.body : null,
          createdAt: row.createdAt,
        };
      }),
    );
    return {
      items: items.filter((item) => item !== null),
      hasMore: rows.length > limit,
      /** Where you are: your messages open to those who get this far. */
      myPercent: me.percent,
    };
  },
});

export const send = mutation({
  args: { id: v.id("groups"), body: v.string() },
  handler: async (ctx, args) => {
    const viewer = await requireVerifiedViewer(ctx);
    const group = await requireMember(ctx, args.id, viewer._id);
    const { body } = parse(groupMessageSchema, { body: args.body });
    await enforceRateLimit(ctx, "groupMessage", viewer._id);
    const book = await ctx.db.get(group.bookId);
    if (!book) throw notFound("Grupo");
    const { percent } = await progressOf(ctx, viewer._id, book);
    const now = Date.now();
    const id = await ctx.db.insert("groupMessages", {
      groupId: group._id,
      authorId: viewer._id,
      body,
      percent,
      createdAt: now,
    });
    await ctx.db.patch(group._id, { lastMessageAt: now });
    return { id };
  },
});

/** Deletes a message: its author, or the group's owner (moderating their group). */
export const removeMessage = mutation({
  args: { id: v.id("groupMessages") },
  handler: async (ctx, { id }) => {
    const viewer = await requireViewer(ctx);
    const message = await ctx.db.get(id);
    if (!message) return null;
    const group = await requireMember(ctx, message.groupId, viewer._id);
    if (message.authorId !== viewer._id && group.ownerId !== viewer._id) {
      throw appError("FORBIDDEN", "Você não pode apagar esta mensagem.");
    }
    await ctx.db.delete(id);
    return null;
  },
});
