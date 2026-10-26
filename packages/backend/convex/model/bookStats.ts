import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/** What one shelf entry adds to its book's counters: a reader and, when rated, a rating. */
const contribution = (entry: { rating: number | null }) => ({
  readers: 1,
  ratingSum: entry.rating ?? 0,
  ratings: entry.rating ? 1 : 0,
});

/**
 * Keeps the book's denormalized community numbers (`readerCount`, `ratingSum`, `ratingCount`)
 * in step with its shelf entries, so the book page never scans them. `before`/`after` are the
 * entry around a change (`null` = it didn't exist). Books not yet backfilled
 * (`migrations.backfillBookCounters`) are left alone: the backfill computes them from scratch.
 */
export async function recordBookCounters(
  ctx: MutationCtx,
  bookId: Id<"books">,
  before: { rating: number | null } | null,
  after: { rating: number | null } | null,
) {
  const book = await ctx.db.get(bookId);
  if (!book || book.readerCount === undefined) return;
  const was = before ? contribution(before) : { readers: 0, ratingSum: 0, ratings: 0 };
  const now = after ? contribution(after) : { readers: 0, ratingSum: 0, ratings: 0 };
  await ctx.db.patch(bookId, {
    readerCount: Math.max(0, book.readerCount + now.readers - was.readers),
    ratingSum: Math.max(0, (book.ratingSum ?? 0) + now.ratingSum - was.ratingSum),
    ratingCount: Math.max(0, (book.ratingCount ?? 0) + now.ratings - was.ratings),
  });
}

/** The community numbers of a book from its counters, or `null` while it isn't backfilled. */
export function communityFromCounters(book: Doc<"books">) {
  if (book.readerCount === undefined) return null;
  const ratings = book.ratingCount ?? 0;
  return {
    readers: book.readerCount,
    ratings,
    averageRating: ratings ? Math.round(((book.ratingSum ?? 0) / ratings) * 10) / 10 : null,
  };
}

/** The numbers computed from the entries themselves (backfill, and books without counters). */
export function countEntries(entries: { rating: number | null }[]) {
  const rated = entries.flatMap((entry) => (entry.rating ? [entry.rating] : []));
  return {
    readerCount: entries.length,
    ratingSum: rated.reduce((sum, rating) => sum + rating, 0),
    ratingCount: rated.length,
  };
}
