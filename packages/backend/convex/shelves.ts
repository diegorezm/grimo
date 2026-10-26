import { addToShelfSchema, updateShelfEntrySchema } from "@grimo/core";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { parse } from "./model/errors";
import { enforceRateLimit } from "./model/rateLimit";
import { requireViewer } from "./model/readers";
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

export const add = mutation({
  args: { book: bookInput, status: shelfStatus },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const input = parse(addToShelfSchema, args);
    await enforceRateLimit(ctx, "addToShelf", viewer._id);
    const { openLibraryId } = input.book;
    const isNew = !(await bookByOpenLibraryId(ctx, openLibraryId));
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
  },
  handler: async (ctx, { id, ...patch }) => {
    const viewer = await requireViewer(ctx);
    const input = parse(updateShelfEntrySchema, patch);
    return { entry: entryView(await updateShelfEntry(ctx, viewer._id, id, input)) };
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
