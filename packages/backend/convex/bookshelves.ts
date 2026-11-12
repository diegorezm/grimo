import {
  copyName,
  groupByYearRead,
  MAX_BULK_BOOKS,
  MAX_SHELVES,
  MAX_SHELVES_PER_BOOK,
  PUBLIC_SHELF_STATUSES,
  type ShelfStatus,
  type ShelfStyle,
  shelfNameSchema,
  shelfStyleOf,
  shelfStyleSchema,
  yearOf,
} from "@grimo/core";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, type QueryCtx, query } from "./_generated/server";
import { appError, notFound, parse } from "./model/errors";
import { getViewer, readerByUsername, requireViewer, timeZoneOf } from "./model/readers";
import { hasBlocked } from "./model/safety";
import { withBooks } from "./model/shelves";
import { shelfStyle } from "./schema";

/**
 * The shelves a reader makes ("Física", "Kindle", "Emprestei"). A book is on a shelf when its
 * shelf entry's `tagIds` hold the shelf, so a book can be on many. Status and genre are filters
 * inside a shelf, not shelves (`@grimo/core` shelves/filters).
 */

/** Covers per shelf on a profile. */
const SHELF_COVERS = 60;

type Ctx = QueryCtx | MutationCtx;

const shelvesOf = (ctx: Ctx, userId: Id<"users">) =>
  ctx.db
    .query("shelfTags")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

const entriesOf = (ctx: Ctx, userId: Id<"users">) =>
  ctx.db
    .query("shelfEntries")
    .withIndex("by_user_updated", (q) => q.eq("userId", userId))
    .order("desc")
    .collect();

async function ownShelf(ctx: MutationCtx, viewer: Doc<"users">, raw: string) {
  const id = ctx.db.normalizeId("shelfTags", raw);
  const shelf = id ? await ctx.db.get(id) : null;
  if (!shelf || shelf.userId !== viewer._id) throw notFound("Estante");
  return shelf;
}

/** A name free among the reader's shelves (case-insensitive). */
async function assertFreeName(
  ctx: MutationCtx,
  viewer: Doc<"users">,
  name: string,
  except?: string,
) {
  const taken = (await shelvesOf(ctx, viewer._id)).some(
    (shelf) => shelf._id !== except && shelf.name.toLowerCase() === name.toLowerCase(),
  );
  if (taken) throw appError("INVALID", "Você já tem uma estante com esse nome");
}

async function newShelf(
  ctx: MutationCtx,
  viewer: Doc<"users">,
  rawName: string,
  isPublic: boolean,
  style?: ShelfStyle,
) {
  const name = parse(shelfNameSchema, rawName);
  if ((await shelvesOf(ctx, viewer._id)).length >= MAX_SHELVES) {
    throw appError("INVALID", `Você pode ter até ${MAX_SHELVES} estantes`);
  }
  await assertFreeName(ctx, viewer, name);
  return ctx.db.insert("shelfTags", {
    userId: viewer._id,
    name,
    isPublic,
    createdAt: Date.now(),
    ...(style ? { style: parse(shelfStyleSchema, style) } : {}),
  });
}

/** Your shelf entries among `entryIds` (any other id is refused). */
async function ownEntries(ctx: MutationCtx, viewer: Doc<"users">, entryIds: string[]) {
  if (entryIds.length > MAX_BULK_BOOKS) {
    throw appError("INVALID", `Escolha até ${MAX_BULK_BOOKS} livros de uma vez`);
  }
  return Promise.all(
    [...new Set(entryIds)].map(async (raw) => {
      const id = ctx.db.normalizeId("shelfEntries", raw);
      const entry = id ? await ctx.db.get(id) : null;
      if (!entry || entry.userId !== viewer._id) throw notFound("Livro da estante");
      return entry;
    }),
  );
}

/** Puts these books on the shelf (or takes them off). */
async function setOnShelf(
  ctx: MutationCtx,
  entries: Doc<"shelfEntries">[],
  shelfId: Id<"shelfTags">,
  on: boolean,
) {
  for (const entry of entries) {
    const current = entry.tagIds ?? [];
    if (on === current.includes(shelfId)) continue;
    if (on && current.length >= MAX_SHELVES_PER_BOOK) {
      throw appError("INVALID", `Um livro pode estar em até ${MAX_SHELVES_PER_BOOK} estantes`);
    }
    await ctx.db.patch(entry._id, {
      tagIds: on ? [...current, shelfId] : current.filter((id) => id !== shelfId),
    });
  }
}

/**
 * Your shelves with how many books each has and how each looks, in the order you made them;
 * `all` is "Todos os meus livros".
 */
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const [shelves, entries] = await Promise.all([
      shelvesOf(ctx, viewer._id),
      entriesOf(ctx, viewer._id),
    ]);
    const counts = new Map<string, number>();
    for (const entry of entries) {
      for (const id of entry.tagIds ?? []) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return {
      all: { style: shelfStyleOf(viewer.shelfStyle) },
      items: shelves.map((shelf) => ({
        id: shelf._id as string,
        name: shelf.name,
        isPublic: shelf.isPublic ?? false,
        count: counts.get(shelf._id) ?? 0,
        style: shelfStyleOf(shelf.style),
      })),
    };
  },
});

/** A new shelf, with these books already on it ("Nova estante com estes"). */
export const create = mutation({
  args: {
    name: v.string(),
    isPublic: v.boolean(),
    entryIds: v.optional(v.array(v.string())),
    style: v.optional(shelfStyle),
  },
  handler: async (ctx, { name, isPublic, entryIds = [], style }) => {
    const viewer = await requireViewer(ctx);
    const entries = await ownEntries(ctx, viewer, entryIds);
    const id = await newShelf(ctx, viewer, name, isPublic, style);
    await setOnShelf(ctx, entries, id, true);
    return { id: id as string };
  },
});

export const rename = mutation({
  args: { id: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const shelf = await ownShelf(ctx, viewer, args.id);
    const name = parse(shelfNameSchema, args.name);
    await assertFreeName(ctx, viewer, name, shelf._id);
    await ctx.db.patch(shelf._id, { name });
    return null;
  },
});

export const setPublic = mutation({
  args: { id: v.string(), isPublic: v.boolean() },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const shelf = await ownShelf(ctx, viewer, args.id);
    await ctx.db.patch(shelf._id, { isPublic: args.isPublic });
    return null;
  },
});

/** How a shelf looks; no `id`: "Todos os meus livros". */
export const setStyle = mutation({
  args: { id: v.optional(v.string()), style: shelfStyle },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const style = parse(shelfStyleSchema, args.style);
    if (args.id === undefined) {
      await ctx.db.patch(viewer._id, { shelfStyle: style });
      return null;
    }
    const shelf = await ownShelf(ctx, viewer, args.id);
    await ctx.db.patch(shelf._id, { style });
    return null;
  },
});

/** Deletes a shelf: its books stay in your readings, only the grouping goes. */
export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const shelf = await ownShelf(ctx, viewer, args.id);
    const on = (await entriesOf(ctx, viewer._id)).filter((entry) =>
      entry.tagIds?.includes(shelf._id),
    );
    await setOnShelf(ctx, on, shelf._id, false);
    await ctx.db.delete(shelf._id);
    return {
      entryIds: on.map((entry) => entry._id as string),
      name: shelf.name,
      style: shelfStyleOf(shelf.style),
    };
  },
});

/** A copy of a shelf with the same books ("Física (cópia)"), to trim afterwards. */
export const duplicate = mutation({
  args: { id: v.string(), name: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const shelf = await ownShelf(ctx, viewer, args.id);
    const on = (await entriesOf(ctx, viewer._id)).filter((entry) =>
      entry.tagIds?.includes(shelf._id),
    );
    const id = await newShelf(
      ctx,
      viewer,
      args.name ?? copyName(shelf.name),
      false,
      shelfStyleOf(shelf.style),
    );
    await setOnShelf(ctx, on, id, true);
    return { id: id as string };
  },
});

/** Puts books on a shelf, or takes them off. */
export const setBooks = mutation({
  args: { shelfId: v.string(), entryIds: v.array(v.string()), on: v.boolean() },
  handler: async (ctx, { shelfId, entryIds, on }) => {
    const viewer = await requireViewer(ctx);
    const shelf = await ownShelf(ctx, viewer, shelfId);
    await setOnShelf(ctx, await ownEntries(ctx, viewer, entryIds), shelf._id, on);
    return null;
  },
});

/** Moves books from one shelf to another. */
export const move = mutation({
  args: { fromId: v.string(), toId: v.string(), entryIds: v.array(v.string()) },
  handler: async (ctx, { fromId, toId, entryIds }) => {
    const viewer = await requireViewer(ctx);
    const [from, to] = await Promise.all([
      ownShelf(ctx, viewer, fromId),
      ownShelf(ctx, viewer, toId),
    ]);
    if (from._id === to._id) return null;
    const entries = await ownEntries(ctx, viewer, entryIds);
    await setOnShelf(ctx, entries, to._id, true);
    // Re-read: the first patch changed the entries' tags.
    const moved = (await Promise.all(entries.map((entry) => ctx.db.get(entry._id)))).filter(
      (entry): entry is Doc<"shelfEntries"> => entry !== null,
    );
    await setOnShelf(ctx, moved, from._id, false);
    return null;
  },
});

/**
 * A reader's shelves as rows of covers on their profile. Others see only the public shelves,
 * and in them only books read or being read; the owner sees all of them, whole.
 */
export const profile = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const [reader, viewer] = await Promise.all([readerByUsername(ctx, username), getViewer(ctx)]);
    if (viewer && (await hasBlocked(ctx, reader._id, viewer._id))) throw notFound("Leitor");
    const isOwner = viewer?._id === reader._id;
    const shelves = (await shelvesOf(ctx, reader._id)).filter((shelf) => isOwner || shelf.isPublic);
    if (shelves.length === 0) return { items: [] };

    const entries = (await entriesOf(ctx, reader._id)).filter(
      (entry) =>
        (entry.tagIds?.length ?? 0) > 0 &&
        (isOwner || (PUBLIC_SHELF_STATUSES as readonly ShelfStatus[]).includes(entry.status)),
    );
    const rows = await withBooks(ctx, entries, viewer?._id ?? null);
    return {
      items: shelves.map((shelf) => {
        const on = rows.filter((row) => row.entry.tagIds.includes(shelf._id));
        return {
          id: shelf._id as string,
          name: shelf.name,
          isPublic: shelf.isPublic ?? false,
          count: on.length,
          style: shelfStyleOf(shelf.style),
          covers: on.slice(0, SHELF_COVERS).map(({ entry, book }) => ({
            entryId: entry.id,
            openLibraryId: book.openLibraryId,
            title: book.title,
            coverUrl: book.coverUrl,
          })),
        };
      }),
    };
  },
});

/** Books a full shelf shows at most (its newest). */
const FULL_SHELF = 500;

/**
 * One whole shelf of a reader, opened from their profile: "reading", "read" (in runs by the
 * year each book was finished) or a shelf they made. Same rules as the profile: others see
 * public shelves only, and in them only books read or being read.
 */
export const profileShelf = query({
  args: { username: v.string(), shelf: v.string() },
  handler: async (ctx, { username, shelf }) => {
    const [reader, viewer] = await Promise.all([readerByUsername(ctx, username), getViewer(ctx)]);
    if (viewer && (await hasBlocked(ctx, reader._id, viewer._id))) throw notFound("Leitor");
    const isOwner = viewer?._id === reader._id;
    const entries = await entriesOf(ctx, reader._id);

    let name: string;
    let isPublic = true;
    let style = shelfStyleOf(reader.shelfStyle);
    let picked: Doc<"shelfEntries">[];
    if (shelf === "reading" || shelf === "read") {
      name = shelf === "reading" ? "Lendo" : "Lidos";
      picked = entries.filter((entry) => entry.status === shelf);
    } else {
      const id = ctx.db.normalizeId("shelfTags", shelf);
      const made = id ? await ctx.db.get(id) : null;
      if (!made || made.userId !== reader._id || (!isOwner && !made.isPublic)) {
        throw notFound("Estante");
      }
      name = made.name;
      isPublic = made.isPublic ?? false;
      style = shelfStyleOf(made.style);
      picked = entries.filter(
        (entry) =>
          entry.tagIds?.includes(made._id) &&
          (isOwner || (PUBLIC_SHELF_STATUSES as readonly ShelfStatus[]).includes(entry.status)),
      );
    }
    if (shelf === "read") {
      picked.sort((a, b) => (b.finishedAt ?? -1) - (a.finishedAt ?? -1));
    }
    const rows = await withBooks(ctx, picked.slice(0, FULL_SHELF), viewer?._id ?? null);
    const items = rows.map(({ entry, book }) => ({
      entry: { id: entry.id, finishedAt: entry.finishedAt },
      book: {
        title: book.title,
        coverUrl: book.coverUrl,
        openLibraryId: book.openLibraryId,
        pageCount: book.pageCount,
      },
    }));
    const timeZone = timeZoneOf(reader);
    return {
      name,
      isPublic,
      style,
      count: picked.length,
      owner: { username: reader.username, name: reader.name },
      runs:
        shelf === "read"
          ? groupByYearRead(
              items.map((item) => ({ ...item, finishedAt: item.entry.finishedAt })),
              (date) => yearOf(date, timeZone),
            )
          : [{ year: null, items }],
    };
  },
});
