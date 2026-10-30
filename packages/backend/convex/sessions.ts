import {
  readingStreak,
  sessionMinutes,
  toDayKey,
  updateNoteSchema,
  updateShelfEntrySchema,
} from "@grimo/core";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, type QueryCtx, query } from "./_generated/server";
import { bookSummary } from "./model/content";
import { appError, notFound, parse } from "./model/errors";
import { enforceRateLimit } from "./model/rateLimit";
import { requireVerifiedViewer, requireViewer, timeZoneOf } from "./model/readers";
import { updateShelfEntry } from "./model/shelves";

/** Days of reading looked at for the streak (a year of daily reading is plenty to show). */
const STREAK_LOOKBACK_DAYS = 400;
const DAY = 24 * 60 * 60 * 1000;

const openSession = (ctx: QueryCtx | MutationCtx, userId: Id<"users">) =>
  ctx.db
    .query("readingSessions")
    .withIndex("by_user_ended", (q) => q.eq("userId", userId).eq("endedAt", null))
    .first();

/** The session running now (its timer starts at `startedAt`), or null. */
export const active = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const session = await openSession(ctx, viewer._id);
    if (!session) return null;
    const [book, entry] = await Promise.all([
      ctx.db.get(session.bookId),
      ctx.db.get(session.shelfEntryId),
    ]);
    if (!book || !entry) return null;
    return {
      id: session._id,
      entryId: entry._id,
      startedAt: session.startedAt,
      startPage: session.startPage,
      book: bookSummary(book),
    };
  },
});

/** Starts the timer on a book you are reading (a session already open is replaced). */
export const start = mutation({
  args: { entryId: v.id("shelfEntries") },
  handler: async (ctx, { entryId }) => {
    const viewer = await requireViewer(ctx);
    const entry = await ctx.db.get(entryId);
    if (!entry || entry.userId !== viewer._id) throw notFound("Livro na estante");
    if (entry.status !== "reading") {
      throw appError("INVALID", "Coloque o livro em “Lendo” para começar uma sessão.");
    }
    const previous = await openSession(ctx, viewer._id);
    if (previous) await ctx.db.delete(previous._id);
    const id = await ctx.db.insert("readingSessions", {
      userId: viewer._id,
      shelfEntryId: entry._id,
      bookId: entry.bookId,
      startedAt: Date.now(),
      endedAt: null,
      startPage: entry.currentPage,
      endPage: null,
    });
    return { id };
  },
});

/**
 * Stops the timer at `page`: the page is marked like any update (reading log, feed, streak) and
 * the feed says "leu 40 páginas em 35 min". `note` goes with it, like when marking the page.
 */
export const finish = mutation({
  args: {
    page: v.number(),
    note: v.optional(v.object({ body: v.string(), hasSpoilers: v.boolean() })),
  },
  handler: async (ctx, args) => {
    const viewer = args.note ? await requireVerifiedViewer(ctx) : await requireViewer(ctx);
    const session = await openSession(ctx, viewer._id);
    if (!session) throw notFound("Sessão de leitura");
    const { currentPage } = parse(updateShelfEntrySchema, { currentPage: args.page });
    const note = args.note ? parse(updateNoteSchema, args.note) : undefined;
    if (note) await enforceRateLimit(ctx, "createPost", viewer._id);
    const now = Date.now();
    const minutes = sessionMinutes(session.startedAt, now);
    const entry = await updateShelfEntry(
      ctx,
      viewer._id,
      session.shelfEntryId,
      { currentPage },
      now,
      { note, sessionMinutes: minutes },
    );
    await ctx.db.patch(session._id, { endedAt: now, endPage: entry.currentPage });
    return { minutes, pagesRead: Math.max(0, entry.currentPage - session.startPage) };
  },
});

/** Throws the running timer away (nothing is recorded). */
export const discard = mutation({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const session = await openSession(ctx, viewer._id);
    if (session) await ctx.db.delete(session._id);
    return null;
  },
});

/**
 * "Ofensiva": days in a row with reading (pages marked or a timed session), on the reader's
 * own calendar. Not having read yet today keeps it alive until the day ends.
 */
export const streak = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const since = Date.now() - STREAK_LOOKBACK_DAYS * DAY;
    const [logs, sessions] = await Promise.all([
      ctx.db
        .query("readingLogs")
        .withIndex("by_user_created", (q) => q.eq("userId", viewer._id).gte("createdAt", since))
        .collect(),
      ctx.db
        .query("readingSessions")
        .withIndex("by_user_started", (q) => q.eq("userId", viewer._id).gte("startedAt", since))
        .collect(),
    ]);
    const timeZone = timeZoneOf(viewer);
    const days = [
      ...logs.map((log) => log.createdAt),
      ...sessions.flatMap((session) => (session.endedAt === null ? [] : [session.endedAt])),
    ].map((at) => toDayKey(new Date(at), timeZone));
    return readingStreak(days, toDayKey(new Date(), timeZone));
  },
});
