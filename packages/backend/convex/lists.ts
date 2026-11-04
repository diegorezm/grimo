import { isManualBookId, listNoteSchema, listSchema, MAX_LIST_ITEMS, MAX_LISTS } from "@grimo/core";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, query } from "./_generated/server";
import { bookSummary } from "./model/content";
import { appError, notFound, parse } from "./model/errors";
import { deleteList, listTile } from "./model/lists";
import { enforceRateLimit } from "./model/rateLimit";
import {
  authorOf,
  getViewer,
  requireVerifiedViewer,
  requireViewer,
  userByUsername,
} from "./model/readers";
import { blockedIds, isBookVisible, isHidden } from "./model/safety";
import { bookByOpenLibraryId, upsertBook } from "./model/shelves";
import { bookInput } from "./schema";

/** A reader's lists, most recently changed first (public: the profile shows them). */
export const byUser = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const viewer = await getViewer(ctx);
    const owner = await userByUsername(ctx, username.toLowerCase());
    if (!owner || isHidden(owner)) return { items: [] };
    if ((await blockedIds(ctx, viewer?._id ?? null)).has(owner._id)) return { items: [] };
    const lists = await ctx.db
      .query("lists")
      .withIndex("by_owner_updated", (q) => q.eq("ownerId", owner._id))
      .order("desc")
      .take(MAX_LISTS);
    return {
      items: await Promise.all(lists.map((list) => listTile(ctx, list, viewer?._id ?? null))),
    };
  },
});

/** One list with its books (oldest first: the order it was made in). Null when it's gone. */
export const get = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    const id = ctx.db.normalizeId("lists", args.id);
    const list = id ? await ctx.db.get(id) : null;
    const owner = list ? await ctx.db.get(list.ownerId) : null;
    if (!list || !owner || isHidden(owner)) return null;
    if ((await blockedIds(ctx, viewer?._id ?? null)).has(owner._id)) return null;
    const items = await ctx.db
      .query("listItems")
      .withIndex("by_list_added", (q) => q.eq("listId", list._id))
      .take(MAX_LIST_ITEMS);
    const books = await Promise.all(items.map((item) => ctx.db.get(item.bookId)));
    return {
      id: list._id,
      title: list.title,
      description: list.description,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      owner: authorOf(owner),
      isMine: viewer?._id === owner._id,
      items: items.flatMap((item, i) => {
        const book = books[i];
        return book && isBookVisible(book, viewer?._id ?? null)
          ? [{ id: item._id, note: item.note, addedAt: item.addedAt, book: bookSummary(book) }]
          : [];
      }),
    };
  },
});

/** My lists for the "Adicionar a uma lista" picker, with whether `openLibraryId` is in each. */
export const mine = query({
  args: { openLibraryId: v.optional(v.string()) },
  handler: async (ctx, { openLibraryId }) => {
    const viewer = await requireViewer(ctx);
    const [lists, book] = await Promise.all([
      ctx.db
        .query("lists")
        .withIndex("by_owner_updated", (q) => q.eq("ownerId", viewer._id))
        .order("desc")
        .take(MAX_LISTS),
      openLibraryId ? bookByOpenLibraryId(ctx, openLibraryId) : null,
    ]);
    const has = await Promise.all(
      lists.map((list) =>
        book
          ? ctx.db
              .query("listItems")
              .withIndex("by_list_book", (q) => q.eq("listId", list._id).eq("bookId", book._id))
              .first()
          : null,
      ),
    );
    return {
      items: lists.map((list, i) => ({
        id: list._id,
        title: list.title,
        itemCount: list.itemCount,
        hasBook: has[i] !== null,
      })),
    };
  },
});

async function ownList(ctx: MutationCtx, userId: Id<"users">, listId: Id<"lists">) {
  const list = await ctx.db.get(listId);
  if (!list || list.ownerId !== userId) throw notFound("Lista");
  return list;
}

export const create = mutation({
  args: { title: v.string(), description: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const viewer = await requireVerifiedViewer(ctx);
    const input = parse(listSchema, args);
    await enforceRateLimit(ctx, "createPost", viewer._id);
    const count = await ctx.db
      .query("lists")
      .withIndex("by_owner_updated", (q) => q.eq("ownerId", viewer._id))
      .take(MAX_LISTS);
    if (count.length >= MAX_LISTS) {
      throw appError("INVALID", `Você já tem ${MAX_LISTS} listas. Apague uma para criar outra.`);
    }
    const now = Date.now();
    const id = await ctx.db.insert("lists", {
      ownerId: viewer._id,
      ...input,
      itemCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    return { id };
  },
});

export const update = mutation({
  args: { id: v.id("lists"), title: v.string(), description: v.optional(v.string()) },
  handler: async (ctx, { id, ...args }) => {
    const viewer = await requireVerifiedViewer(ctx);
    const input = parse(listSchema, args);
    await ownList(ctx, viewer._id, id);
    await ctx.db.patch(id, { ...input, updatedAt: Date.now() });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("lists") },
  handler: async (ctx, { id }) => {
    const viewer = await requireViewer(ctx);
    await deleteList(ctx, await ownList(ctx, viewer._id, id));
    return null;
  },
});

/** Puts a book on one of my lists (again: just updates the note). */
export const addBook = mutation({
  args: { listId: v.id("lists"), book: bookInput, note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const viewer = await requireVerifiedViewer(ctx);
    const list = await ownList(ctx, viewer._id, args.listId);
    const note = parse(listNoteSchema, args.note ?? null);
    const { openLibraryId } = args.book;
    const existing = await bookByOpenLibraryId(ctx, openLibraryId);
    // Hand-added books come from `books.addManual`, never from what a client sends here.
    if (isManualBookId(openLibraryId) && (!existing || !isBookVisible(existing, viewer._id))) {
      throw notFound("Livro");
    }
    const bookId = existing?._id ?? (await upsertBook(ctx, args.book));
    const already = await ctx.db
      .query("listItems")
      .withIndex("by_list_book", (q) => q.eq("listId", list._id).eq("bookId", bookId))
      .first();
    const now = Date.now();
    if (already) {
      await ctx.db.patch(already._id, { note });
    } else {
      if (list.itemCount >= MAX_LIST_ITEMS) {
        throw appError("INVALID", `Uma lista tem até ${MAX_LIST_ITEMS} livros.`);
      }
      await ctx.db.insert("listItems", { listId: list._id, bookId, note, addedAt: now });
      await ctx.db.patch(list._id, { itemCount: list.itemCount + 1 });
    }
    await ctx.db.patch(list._id, { updatedAt: now });
    return null;
  },
});

export const removeBook = mutation({
  args: { listId: v.id("lists"), openLibraryId: v.string() },
  handler: async (ctx, { listId, openLibraryId }) => {
    const viewer = await requireViewer(ctx);
    const list = await ownList(ctx, viewer._id, listId);
    const book = await bookByOpenLibraryId(ctx, openLibraryId);
    const item = book
      ? await ctx.db
          .query("listItems")
          .withIndex("by_list_book", (q) => q.eq("listId", list._id).eq("bookId", book._id))
          .first()
      : null;
    if (!item) return null;
    await ctx.db.delete(item._id);
    await ctx.db.patch(list._id, {
      itemCount: Math.max(0, list.itemCount - 1),
      updatedAt: Date.now(),
    });
    return null;
  },
});
