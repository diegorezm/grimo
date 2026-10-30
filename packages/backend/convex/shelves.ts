import {
  addToShelfSchema,
  isManualBookId,
  updateNoteSchema,
  updateShelfEntrySchema,
} from "@grimo/core";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { notFound, parse } from "./model/errors";
import { booksFriendsWant } from "./model/friends";
import { listLimit } from "./model/limits";
import { enforceRateLimit } from "./model/rateLimit";
import { requireVerifiedViewer, requireViewer } from "./model/readers";
import { isBookVisible } from "./model/safety";
import {
  addToShelf,
  bookByOpenLibraryId,
  entryView,
  removeFromShelf,
  updateShelfEntry,
  withBooks,
} from "./model/shelves";
import { bookInput, shelfStatus } from "./schema";

/** Your shelves (`{ entry, book }`), most recently touched first. Omit `status` for all. */
export const list = query({
  args: { status: v.optional(shelfStatus) },
  handler: async (ctx, { status }) => {
    const viewer = await requireViewer(ctx);
    const entries = status
      ? await ctx.db
          .query("shelfEntries")
          .withIndex("by_user_status_updated", (q) =>
            q.eq("userId", viewer._id).eq("status", status),
          )
          .order("desc")
          .collect()
      : await ctx.db
          .query("shelfEntries")
          .withIndex("by_user_updated", (q) => q.eq("userId", viewer._id))
          .order("desc")
          .collect();
    return { items: await withBooks(ctx, entries) };
  },
});

/** Books the people you follow want to read, the most wanted first (`model/friends.ts`). */
export const friendsWant = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    return { items: await booksFriendsWant(ctx, viewer._id, listLimit(args.limit)) };
  },
});

export const add = mutation({
  args: { book: bookInput, status: shelfStatus },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const input = parse(addToShelfSchema, args);
    await enforceRateLimit(ctx, "addToShelf", viewer._id);
    const { openLibraryId } = input.book;
    const existing = await bookByOpenLibraryId(ctx, openLibraryId);
    // Hand-added books come from `books.addManual`, never from what a client sends here.
    if (isManualBookId(openLibraryId) && (!existing || !isBookVisible(existing, viewer._id))) {
      throw notFound("Livro");
    }
    const isNew = !existing;
    const entry = await addToShelf(ctx, viewer._id, input);
    // The client said what this book is; Open Library has the last word (`books.refreshBook`).
    if (isNew) await ctx.scheduler.runAfter(0, internal.books.refreshBook, { openLibraryId });
    return { entry: entryView(entry) };
  },
});

export const update = mutation({
  args: {
    id: v.id("shelfEntries"),
    status: v.optional(shelfStatus),
    currentPage: v.optional(v.number()),
    rating: v.optional(v.union(v.number(), v.null())),
    startedAt: v.optional(v.union(v.number(), v.null())),
    finishedAt: v.optional(v.union(v.number(), v.null())),
    pageCount: v.optional(v.union(v.number(), v.null())),
    /** A note on this update (Skoob's "comentário de leitura"): it shows in the feed. */
    note: v.optional(v.object({ body: v.string(), hasSpoilers: v.boolean() })),
  },
  handler: async (ctx, { id, note, ...patch }) => {
    // Writing in the feed is social, so it needs a confirmed email (marking pages doesn't).
    const viewer = note ? await requireVerifiedViewer(ctx) : await requireViewer(ctx);
    const input = parse(updateShelfEntrySchema, patch);
    const noteInput = note ? parse(updateNoteSchema, note) : undefined;
    if (noteInput) await enforceRateLimit(ctx, "createPost", viewer._id);
    const entry = await updateShelfEntry(ctx, viewer._id, id, input, Date.now(), {
      note: noteInput,
    });
    return { entry: entryView(entry) };
  },
});

export const remove = mutation({
  args: { id: v.id("shelfEntries") },
  handler: async (ctx, { id }) => {
    const viewer = await requireViewer(ctx);
    await removeFromShelf(ctx, viewer._id, id);
    return null;
  },
});
