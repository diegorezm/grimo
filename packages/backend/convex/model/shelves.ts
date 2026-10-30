import {
  type BookInput,
  editionPages,
  type ImportedBook,
  planShelfTransition,
  type ShelfStatus,
  type UpdateShelfEntryInput,
} from "@grimo/core";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { recordBookCounters } from "./bookStats";
import { recordActivity, updatePostFor } from "./content";
import { appError, notFound } from "./errors";
import { isBookVisible } from "./safety";

/** Shelf entry as clients see it. */
export const entryView = (entry: Doc<"shelfEntries">) => ({
  id: entry._id,
  bookId: entry.bookId,
  status: entry.status,
  currentPage: entry.currentPage,
  /** Pages of this reader's edition, when they set one. */
  pageCount: entry.pageCount ?? null,
  rating: entry.rating,
  startedAt: entry.startedAt,
  finishedAt: entry.finishedAt,
  createdAt: entry._creationTime,
  updatedAt: entry.updatedAt,
});

export const bookView = (book: Doc<"books">) => ({
  id: book._id,
  openLibraryId: book.openLibraryId,
  title: book.title,
  authors: book.authors,
  coverUrl: book.coverUrl,
  pageCount: book.pageCount,
  publishedYear: book.publishedYear,
  genres: book.genres,
});

/**
 * `{ entry, book }` rows for these entries (entries whose book is gone are dropped). The book's
 * `pageCount` is the reader's edition, so progress is right wherever the row is shown. With
 * `viewerId` (someone else's shelf), books that viewer can't see are left out.
 */
export async function withBooks(
  ctx: QueryCtx | MutationCtx,
  entries: Doc<"shelfEntries">[],
  viewerId?: Id<"users"> | null,
) {
  const rows = await Promise.all(
    entries.map(async (entry) => {
      const book = await ctx.db.get(entry.bookId);
      if (!book) return null;
      if (viewerId !== undefined && !isBookVisible(book, viewerId)) return null;
      const pageCount = editionPages(entry.pageCount, book.pageCount);
      return { entry: entryView(entry), book: { ...bookView(book), pageCount } };
    }),
  );
  return rows.filter((row) => row !== null);
}

export const bookByOpenLibraryId = (ctx: QueryCtx | MutationCtx, openLibraryId: string) =>
  ctx.db
    .query("books")
    .withIndex("by_openLibraryId", (q) => q.eq("openLibraryId", openLibraryId))
    .unique();

/**
 * Saves the book locally and returns its id. An existing book is shared by every reader, so
 * client input only fills what is missing (never overwrites).
 */
export async function upsertBook(ctx: MutationCtx, input: BookInput) {
  const existing = await bookByOpenLibraryId(ctx, input.openLibraryId);
  if (existing) {
    const missing: Partial<Doc<"books">> = {};
    if (!existing.coverUrl && input.coverUrl) missing.coverUrl = input.coverUrl;
    if (!existing.pageCount && input.pageCount) missing.pageCount = input.pageCount;
    if (existing.authors.length === 0 && input.authors.length) missing.authors = input.authors;
    if (Object.keys(missing).length > 0) await ctx.db.patch(existing._id, missing);
    return existing._id;
  }
  return ctx.db.insert("books", { ...input, readerCount: 0, ratingSum: 0, ratingCount: 0 });
}

const toMs = (date: Date | null | undefined) =>
  date === undefined ? undefined : date === null ? null : date.getTime();

/** Converts a planned patch (Dates) to fields to store (epoch ms). */
function storedPatch(set: UpdateShelfEntryInput) {
  const patch: Partial<Doc<"shelfEntries">> = {};
  if (set.status !== undefined) patch.status = set.status;
  if (set.currentPage !== undefined) patch.currentPage = set.currentPage;
  if (set.rating !== undefined) patch.rating = set.rating;
  // null clears it (back to the book's pages).
  if (set.pageCount !== undefined) patch.pageCount = set.pageCount ?? undefined;
  const startedAt = toMs(set.startedAt);
  if (startedAt !== undefined) patch.startedAt = startedAt;
  const finishedAt = toMs(set.finishedAt);
  if (finishedAt !== undefined) patch.finishedAt = finishedAt;
  return patch;
}

/** What a reader wrote about the page they marked (or the book they finished). */
type UpdateNote = { body: string; hasSpoilers: boolean };

/** Extras of a shelf change: the reader's note, and the timed session it closes. */
export interface UpdateExtras {
  note?: UpdateNote;
  /** Minutes of the session; the feed says "leu 40 páginas em 35 min". */
  sessionMinutes?: number;
}

/** Reading log + feed activity for a shelf change, with the reader's note on it. */
async function recordSideEffects(
  ctx: MutationCtx,
  entry: Doc<"shelfEntries">,
  pagesRead: number,
  activity: Doc<"activities">["kind"] | null,
  now: number,
  { note, sessionMinutes }: UpdateExtras = {},
) {
  if (pagesRead > 0) {
    await ctx.db.insert("readingLogs", {
      userId: entry.userId,
      shelfEntryId: entry._id,
      page: entry.currentPage,
      pagesRead,
      createdAt: now,
    });
  }
  if (activity) {
    const activityId = await recordActivity(ctx, {
      actorId: entry.userId,
      kind: activity,
      bookId: entry.bookId,
      data: {
        status: entry.status,
        page: entry.currentPage,
        ...(sessionMinutes !== undefined && { minutes: sessionMinutes, pagesRead }),
      },
      createdAt: now,
    });
    if (note) await updatePostFor(ctx, (await ctx.db.get(activityId))!, note);
  } else if (note) {
    // Nothing shows in the feed (same page, same shelf), so there's nothing to comment on.
    throw appError("INVALID", "Marque uma página nova para comentar a leitura.");
  }
}

export async function updateShelfEntry(
  ctx: MutationCtx,
  userId: Id<"users">,
  entryId: Id<"shelfEntries">,
  patch: UpdateShelfEntryInput,
  now = Date.now(),
  extras: UpdateExtras = {},
) {
  const entry = await ctx.db.get(entryId);
  if (!entry || entry.userId !== userId) throw notFound("Livro na estante");
  const book = await ctx.db.get(entry.bookId);

  const plan = planShelfTransition(
    {
      status: entry.status,
      currentPage: entry.currentPage,
      maxPage: entry.maxPage,
      startedAt: entry.startedAt === null ? null : new Date(entry.startedAt),
    },
    patch,
    editionPages(
      patch.pageCount !== undefined ? patch.pageCount : entry.pageCount,
      book?.pageCount ?? null,
    ),
    new Date(now),
  );
  await ctx.db.patch(entryId, {
    ...storedPatch(plan.set),
    maxPage: plan.maxPage,
    updatedAt: now,
  });
  const updated = (await ctx.db.get(entryId))!;
  if (updated.rating !== entry.rating) await recordBookCounters(ctx, entry.bookId, entry, updated);
  await recordSideEffects(ctx, updated, plan.pagesRead, plan.activity, now, extras);
  return updated;
}

export async function addToShelf(
  ctx: MutationCtx,
  userId: Id<"users">,
  input: { book: BookInput; status: ShelfStatus },
  now = Date.now(),
) {
  const bookId = await upsertBook(ctx, input.book);
  const existing = await ctx.db
    .query("shelfEntries")
    .withIndex("by_user_book", (q) => q.eq("userId", userId).eq("bookId", bookId))
    .unique();
  if (existing) return updateShelfEntry(ctx, userId, existing._id, { status: input.status }, now);

  const plan = planShelfTransition(
    { status: null, currentPage: 0, startedAt: null },
    { status: input.status },
    input.book.pageCount,
    new Date(now),
  );
  const entryId = await ctx.db.insert("shelfEntries", {
    userId,
    bookId,
    status: input.status,
    currentPage: 0,
    rating: null,
    startedAt: null,
    finishedAt: null,
    ...storedPatch(plan.set),
    maxPage: plan.maxPage,
    updatedAt: now,
  });
  const user = await ctx.db.get(userId);
  if (user) await ctx.db.patch(userId, { bookCount: user.bookCount + 1 });
  await recordBookCounters(ctx, bookId, null, { rating: null });

  const entry = (await ctx.db.get(entryId))!;
  // Adding a book is always worth a feed entry ("shelved"/"finished").
  await recordSideEffects(ctx, entry, plan.pagesRead, plan.activity ?? "shelved", now);
  return entry;
}

/**
 * Puts a book from an import on the shelf as it was in the other app: status, rating, finish
 * date and edition pages. Quietly: no feed line, no reading log (pages read elsewhere aren't this
 * month's reading). Returns false when the book is already on the shelf (left untouched).
 */
export async function importToShelf(
  ctx: MutationCtx,
  userId: Id<"users">,
  book: BookInput,
  imported: Pick<ImportedBook, "status" | "rating" | "finishedAt" | "pageCount">,
  now = Date.now(),
) {
  const bookId = await upsertBook(ctx, book);
  const existing = await ctx.db
    .query("shelfEntries")
    .withIndex("by_user_book", (q) => q.eq("userId", userId).eq("bookId", bookId))
    .unique();
  if (existing) return false;
  const editionPagesDiffer = imported.pageCount !== null && imported.pageCount !== book.pageCount;
  const pages = editionPages(editionPagesDiffer ? imported.pageCount : null, book.pageCount);
  const currentPage = imported.status === "read" ? (pages ?? 0) : 0;
  await ctx.db.insert("shelfEntries", {
    userId,
    bookId,
    status: imported.status,
    currentPage,
    maxPage: currentPage,
    ...(editionPagesDiffer && { pageCount: imported.pageCount! }),
    rating: imported.rating,
    startedAt: null,
    finishedAt: imported.status === "read" ? imported.finishedAt : null,
    updatedAt: imported.finishedAt ?? now,
  });
  const user = await ctx.db.get(userId);
  if (user) await ctx.db.patch(userId, { bookCount: user.bookCount + 1 });
  await recordBookCounters(ctx, bookId, null, { rating: imported.rating });
  return true;
}

export async function removeFromShelf(
  ctx: MutationCtx,
  userId: Id<"users">,
  entryId: Id<"shelfEntries">,
) {
  const entry = await ctx.db.get(entryId);
  if (!entry || entry.userId !== userId) return;
  const logs = await ctx.db
    .query("readingLogs")
    .withIndex("by_entry", (q) => q.eq("shelfEntryId", entryId))
    .collect();
  for (const log of logs) await ctx.db.delete(log._id);
  await ctx.db.delete(entryId);
  await recordBookCounters(ctx, entry.bookId, entry, null);
  const user = await ctx.db.get(userId);
  if (user) await ctx.db.patch(userId, { bookCount: Math.max(0, user.bookCount - 1) });
}
