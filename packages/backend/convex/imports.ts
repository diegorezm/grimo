import { type BookInput, type ImportedBook, importBooksSchema } from "@grimo/core";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { appError, parse } from "./model/errors";
import { searchOpenLibrary } from "./model/openLibrary";
import { enforceRateLimit } from "./model/rateLimit";
import { requireViewer } from "./model/readers";
import { importToShelf } from "./model/shelves";
import { bookInput, importedBook } from "./schema";

/** Rows looked up per run (each is one to three Open Library searches). */
const BATCH = 5;
/** Pause between runs, to be gentle with Open Library. */
const PAUSE_MS = 500;
/** A row whose lookups keep failing (network) is given up as not found after this. */
const MAX_ATTEMPTS = 3;
/** Titles kept to show as "não encontrados". */
const MAX_NOT_FOUND = 100;

/**
 * Starts importing a Goodreads export (parsed in the browser with `parseGoodreadsCsv`). The
 * books are found in Open Library and shelved in the background; `latest` follows the progress.
 */
export const start = mutation({
  args: { books: v.array(importedBook) },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const { books } = parse(importBooksSchema, args);
    const running = await ctx.db
      .query("imports")
      .withIndex("by_user_created", (q) => q.eq("userId", viewer._id))
      .order("desc")
      .first();
    if (running?.status === "running") {
      throw appError("INVALID", "Já tem uma importação em andamento. Espere ela terminar.");
    }
    await enforceRateLimit(ctx, "importBooks", viewer._id);
    const id = await ctx.db.insert("imports", {
      userId: viewer._id,
      source: "goodreads",
      total: books.length,
      processed: 0,
      added: 0,
      skipped: 0,
      notFound: [],
      notFoundCount: 0,
      status: "running",
      createdAt: Date.now(),
      finishedAt: null,
    });
    for (const [index, book] of books.entries()) {
      await ctx.db.insert("importRows", { importId: id, index, book, attempts: 0 });
    }
    await ctx.scheduler.runAfter(0, internal.imports.work, { id });
    return { id };
  },
});

/** Your latest import (running or done), for the progress and the result. */
export const latest = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const row = await ctx.db
      .query("imports")
      .withIndex("by_user_created", (q) => q.eq("userId", viewer._id))
      .order("desc")
      .first();
    if (!row) return null;
    return {
      id: row._id,
      status: row.status,
      total: row.total,
      processed: row.processed,
      added: row.added,
      skipped: row.skipped,
      notFound: row.notFound,
      notFoundCount: row.notFoundCount,
      createdAt: row.createdAt,
      finishedAt: row.finishedAt,
    };
  },
});

export const nextRows = internalQuery({
  args: { id: v.id("imports") },
  handler: (ctx, { id }) =>
    ctx.db
      .query("importRows")
      .withIndex("by_import_index", (q) => q.eq("importId", id))
      .take(BATCH),
});

/** Open Library's best match: by ISBN first, then by title and author. */
async function findBook(book: ImportedBook): Promise<BookInput | null> {
  const queries = [
    book.isbn13 && `isbn:${book.isbn13}`,
    book.isbn10 && `isbn:${book.isbn10}`,
    `${book.title.replace(/\s*\(.*?\)\s*$/, "")} ${book.authors[0] ?? ""}`.trim(),
  ].filter((query): query is string => Boolean(query));
  for (const query of queries) {
    const [found] = await searchOpenLibrary(query, 1);
    if (found) return found;
  }
  return null;
}

/** One batch: look the rows up in Open Library, shelve them, and schedule the next batch. */
export const work = internalAction({
  args: { id: v.id("imports") },
  handler: async (ctx, { id }): Promise<null> => {
    const rows = await ctx.runQuery(internal.imports.nextRows, { id });
    const results: { rowId: Id<"importRows">; book: BookInput | null; failed: boolean }[] = [];
    for (const row of rows) {
      try {
        results.push({ rowId: row._id, book: await findBook(row.book), failed: false });
      } catch {
        results.push({ rowId: row._id, book: null, failed: true });
      }
    }
    const more = await ctx.runMutation(internal.imports.save, { id, results });
    if (more) await ctx.scheduler.runAfter(PAUSE_MS, internal.imports.work, { id });
    return null;
  },
});

/** Shelves a batch's matches and updates the summary. Returns whether rows remain. */
export const save = internalMutation({
  args: {
    id: v.id("imports"),
    results: v.array(
      v.object({
        rowId: v.id("importRows"),
        book: v.union(bookInput, v.null()),
        failed: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, { id, results }) => {
    const job = await ctx.db.get(id);
    if (!job) return false;
    const summary = {
      processed: job.processed,
      added: job.added,
      skipped: job.skipped,
      notFound: job.notFound,
      notFoundCount: job.notFoundCount,
    };
    for (const result of results) {
      const row = await ctx.db.get(result.rowId);
      if (!row) continue;
      // Open Library unreachable: try this row again on a later run.
      if (result.failed && row.attempts + 1 < MAX_ATTEMPTS) {
        await ctx.db.patch(row._id, { attempts: row.attempts + 1, index: row.index + 1e6 });
        continue;
      }
      if (result.book) {
        const added = await importToShelf(ctx, job.userId, result.book, row.book);
        if (added) summary.added++;
        else summary.skipped++;
      } else {
        summary.notFoundCount++;
        if (summary.notFound.length < MAX_NOT_FOUND) {
          summary.notFound = [...summary.notFound, row.book.title];
        }
      }
      summary.processed++;
      await ctx.db.delete(row._id);
    }
    const left = await ctx.db
      .query("importRows")
      .withIndex("by_import_index", (q) => q.eq("importId", id))
      .first();
    await ctx.db.patch(id, {
      ...summary,
      ...(!left && { status: "done" as const, finishedAt: Date.now() }),
    });
    return left !== null;
  },
});
