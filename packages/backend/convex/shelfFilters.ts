import {
  MAX_BULK_TAG,
  MAX_SAVED_SHELVES,
  MAX_TAGS,
  MAX_TAGS_PER_BOOK,
  matchesShelfFilter,
  PUBLIC_SHELF_STATUSES,
  type ShelfStatus,
  savedShelfSchema,
  tagNameSchema,
} from "@grimo/core";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, type QueryCtx, query } from "./_generated/server";
import { appError, notFound, parse } from "./model/errors";
import { getViewer, readerByUsername, requireViewer } from "./model/readers";
import { hasBlocked } from "./model/safety";
import { withBooks } from "./model/shelves";
import { shelfStatus } from "./schema";

/**
 * One shelf, many views. Personal tags on books ("Tenho", "Kindle") and named filters of the
 * shelf ("Minha estante física" = tag Tenho) that show whatever matches, kept up to date by
 * themselves. See `@grimo/core` shelves/filters.
 */

/** Covers per saved shelf on a profile. */
const SHELF_COVERS = 60;

const filterArgs = v.object({
  statuses: v.array(shelfStatus),
  genres: v.array(v.string()),
  tagIds: v.array(v.string()),
});

const myTags = (ctx: QueryCtx | MutationCtx, userId: Id<"users">) =>
  ctx.db
    .query("shelfTags")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

async function ownTag(ctx: MutationCtx, viewer: Doc<"users">, raw: string) {
  const id = ctx.db.normalizeId("shelfTags", raw);
  const tag = id ? await ctx.db.get(id) : null;
  if (!tag || tag.userId !== viewer._id) throw notFound("Marcador");
  return tag;
}

async function uniqueName(ctx: MutationCtx, viewer: Doc<"users">, name: string, except?: string) {
  const taken = (await myTags(ctx, viewer._id)).some(
    (tag) => tag._id !== except && tag.name.toLowerCase() === name.toLowerCase(),
  );
  if (taken) throw appError("INVALID", "Você já tem um marcador com esse nome");
}

/** Your tags, in the order you made them. */
export const tags = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    return {
      items: (await myTags(ctx, viewer._id)).map((tag) => ({ id: tag._id, name: tag.name })),
    };
  },
});

export const createTag = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const name = parse(tagNameSchema, args.name);
    if ((await myTags(ctx, viewer._id)).length >= MAX_TAGS) {
      throw appError("INVALID", `Você pode ter até ${MAX_TAGS} marcadores`);
    }
    await uniqueName(ctx, viewer, name);
    const id = await ctx.db.insert("shelfTags", {
      userId: viewer._id,
      name,
      createdAt: Date.now(),
    });
    return { id, name };
  },
});

export const renameTag = mutation({
  args: { id: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const tag = await ownTag(ctx, viewer, args.id);
    const name = parse(tagNameSchema, args.name);
    await uniqueName(ctx, viewer, name, tag._id);
    await ctx.db.patch(tag._id, { name });
    return null;
  },
});

/** Deletes a tag: it leaves your books and the saved shelves that filtered by it. */
export const removeTag = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const tag = await ownTag(ctx, viewer, args.id);
    const entries = await ctx.db
      .query("shelfEntries")
      .withIndex("by_user_updated", (q) => q.eq("userId", viewer._id))
      .collect();
    for (const entry of entries) {
      if (entry.tagIds?.includes(tag._id)) {
        await ctx.db.patch(entry._id, { tagIds: entry.tagIds.filter((id) => id !== tag._id) });
      }
    }
    for (const shelf of await mySavedShelves(ctx, viewer._id)) {
      if (shelf.filter.tagIds.includes(tag._id)) {
        await ctx.db.patch(shelf._id, {
          filter: { ...shelf.filter, tagIds: shelf.filter.tagIds.filter((id) => id !== tag._id) },
        });
      }
    }
    await ctx.db.delete(tag._id);
    return null;
  },
});

/** Puts a tag on (or takes it off) several of your books at once: the select mode. */
export const setTag = mutation({
  args: { tagId: v.string(), entryIds: v.array(v.id("shelfEntries")), on: v.boolean() },
  handler: async (ctx, { tagId, entryIds, on }) => {
    const viewer = await requireViewer(ctx);
    const tag = await ownTag(ctx, viewer, tagId);
    if (entryIds.length > MAX_BULK_TAG) {
      throw appError("INVALID", `Marque até ${MAX_BULK_TAG} livros de uma vez`);
    }
    for (const entryId of new Set(entryIds)) {
      const entry = await ctx.db.get(entryId);
      if (!entry || entry.userId !== viewer._id) throw notFound("Livro da estante");
      const current = entry.tagIds ?? [];
      if (on === current.includes(tag._id)) continue;
      if (on && current.length >= MAX_TAGS_PER_BOOK) {
        throw appError("INVALID", `Cada livro pode ter até ${MAX_TAGS_PER_BOOK} marcadores`);
      }
      await ctx.db.patch(entry._id, {
        tagIds: on ? [...current, tag._id] : current.filter((id) => id !== tag._id),
      });
    }
    return null;
  },
});

const mySavedShelves = (ctx: QueryCtx | MutationCtx, userId: Id<"users">) =>
  ctx.db
    .query("savedShelves")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

const savedShelfView = (shelf: Doc<"savedShelves">) => ({
  id: shelf._id,
  name: shelf.name,
  filter: { ...shelf.filter, tagIds: shelf.filter.tagIds as string[] },
  isPublic: shelf.isPublic,
});

/** Your saved shelves, in the order you made them. */
export const savedShelves = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    return { items: (await mySavedShelves(ctx, viewer._id)).map(savedShelfView) };
  },
});

/** Saves the current filter of your shelf with a name (`id`: changes one you have). */
export const saveShelf = mutation({
  args: { id: v.optional(v.string()), name: v.string(), filter: filterArgs, isPublic: v.boolean() },
  handler: async (ctx, { id, ...args }) => {
    const viewer = await requireViewer(ctx);
    const input = parse(savedShelfSchema, args);
    const tagIds = await Promise.all(
      input.filter.tagIds.map(async (raw) => (await ownTag(ctx, viewer, raw))._id),
    );
    const fields = {
      name: input.name,
      filter: { ...input.filter, tagIds },
      isPublic: input.isPublic,
    };
    if (id) {
      const shelfId = ctx.db.normalizeId("savedShelves", id);
      const shelf = shelfId ? await ctx.db.get(shelfId) : null;
      if (!shelf || shelf.userId !== viewer._id) throw notFound("Estante");
      await ctx.db.patch(shelf._id, fields);
      return { id: shelf._id };
    }
    if ((await mySavedShelves(ctx, viewer._id)).length >= MAX_SAVED_SHELVES) {
      throw appError("INVALID", `Você pode salvar até ${MAX_SAVED_SHELVES} estantes`);
    }
    const created = await ctx.db.insert("savedShelves", {
      userId: viewer._id,
      ...fields,
      createdAt: Date.now(),
    });
    return { id: created };
  },
});

export const removeSavedShelf = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const id = ctx.db.normalizeId("savedShelves", args.id);
    const shelf = id ? await ctx.db.get(id) : null;
    if (!shelf || shelf.userId !== viewer._id) throw notFound("Estante");
    await ctx.db.delete(shelf._id);
    return null;
  },
});

/**
 * A reader's saved shelves as rows of covers on their profile. Others see only the public
 * ones, and only books read or being read in them; the owner sees everything.
 */
export const profileShelves = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const [reader, viewer] = await Promise.all([readerByUsername(ctx, username), getViewer(ctx)]);
    if (viewer && (await hasBlocked(ctx, reader._id, viewer._id))) throw notFound("Leitor");
    const isOwner = viewer?._id === reader._id;
    const shelves = (await mySavedShelves(ctx, reader._id)).filter(
      (shelf) => isOwner || shelf.isPublic,
    );
    if (shelves.length === 0) return { items: [] };

    const entries = await ctx.db
      .query("shelfEntries")
      .withIndex("by_user_updated", (q) => q.eq("userId", reader._id))
      .order("desc")
      .collect();
    const visible = isOwner
      ? entries
      : entries.filter((entry) =>
          (PUBLIC_SHELF_STATUSES as readonly ShelfStatus[]).includes(entry.status),
        );
    const rows = await withBooks(ctx, visible, viewer?._id ?? null);

    return {
      items: shelves.map((shelf) => {
        const matching = rows.filter((row) =>
          matchesShelfFilter(row, { ...shelf.filter, tagIds: shelf.filter.tagIds }),
        );
        return {
          ...savedShelfView(shelf),
          count: matching.length,
          covers: matching.slice(0, SHELF_COVERS).map(({ entry, book }) => ({
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
