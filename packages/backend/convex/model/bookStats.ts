import { starBucket, topFeelings } from "@grimo/core";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/** The part of a shelf entry the book's counters are made of. */
type Counted = { rating: number | null; feelings?: readonly string[] };

/** Counters of a book nobody has on a shelf yet. */
export const emptyBookCounters = () => ({
  readerCount: 0,
  ratingSum: 0,
  ratingCount: 0,
  ratingStars: [0, 0, 0, 0, 0],
  feelingCounts: {},
  feelingReaders: 0,
});

/** Adds (`sign` 1) or takes away (-1) what one entry counts in the star bars and feelings. */
function addDetails(
  details: { ratingStars: number[]; feelingCounts: Record<string, number>; feelingReaders: number },
  entry: Counted,
  sign: 1 | -1,
) {
  if (entry.rating) {
    const bar = starBucket(entry.rating);
    details.ratingStars[bar] = Math.max(0, (details.ratingStars[bar] ?? 0) + sign);
  }
  const feelings = entry.feelings ?? [];
  if (feelings.length > 0) details.feelingReaders = Math.max(0, details.feelingReaders + sign);
  for (const feeling of feelings) {
    const count = Math.max(0, (details.feelingCounts[feeling] ?? 0) + sign);
    if (count > 0) details.feelingCounts[feeling] = count;
    else delete details.feelingCounts[feeling];
  }
}

/** What one shelf entry adds to its book's counters: a reader and, when rated, a rating. */
const contribution = (entry: Counted) => ({
  readers: 1,
  ratingSum: entry.rating ?? 0,
  ratings: entry.rating ? 1 : 0,
});

/**
 * Keeps the book's denormalized community numbers (readers, ratings, star bars and feelings)
 * in step with its shelf entries, so the book page never scans them. `before`/`after` are the
 * entry around a change (`null` = it didn't exist). Counters not yet backfilled
 * (`migrations.backfillBookCounters`) are left alone: the backfill computes them from scratch.
 */
export async function recordBookCounters(
  ctx: MutationCtx,
  bookId: Id<"books">,
  before: Counted | null,
  after: Counted | null,
) {
  const book = await ctx.db.get(bookId);
  if (!book || book.readerCount === undefined) return;
  const was = before ? contribution(before) : { readers: 0, ratingSum: 0, ratings: 0 };
  const now = after ? contribution(after) : { readers: 0, ratingSum: 0, ratings: 0 };
  const patch: Partial<Doc<"books">> = {
    readerCount: Math.max(0, book.readerCount + now.readers - was.readers),
    ratingSum: Math.max(0, (book.ratingSum ?? 0) + now.ratingSum - was.ratingSum),
    ratingCount: Math.max(0, (book.ratingCount ?? 0) + now.ratings - was.ratings),
  };
  if (book.ratingStars !== undefined) {
    const details = {
      ratingStars: [...book.ratingStars],
      feelingCounts: { ...book.feelingCounts },
      feelingReaders: book.feelingReaders ?? 0,
    };
    if (before) addDetails(details, before, -1);
    if (after) addDetails(details, after, 1);
    Object.assign(patch, details);
  }
  await ctx.db.patch(bookId, patch);
}

/**
 * The community numbers of a book from its counters, or `null` while they aren't backfilled
 * (the star bars and feelings came after the reader counts).
 */
export function communityFromCounters(
  book: Pick<
    Doc<"books">,
    "readerCount" | "ratingSum" | "ratingCount" | "ratingStars" | "feelingCounts" | "feelingReaders"
  >,
) {
  if (book.readerCount === undefined || book.ratingStars === undefined) return null;
  const ratings = book.ratingCount ?? 0;
  const feelingReaders = book.feelingReaders ?? 0;
  return {
    readers: book.readerCount,
    ratings,
    averageRating: ratings ? Math.round(((book.ratingSum ?? 0) / ratings) * 10) / 10 : null,
    /** Ratings per star bar, 1 star first. */
    stars: book.ratingStars,
    /** Readers who said how the book made them feel, and what they felt the most. */
    feelingReaders,
    feelings: topFeelings(book.feelingCounts ?? {}, feelingReaders),
  };
}

/** The numbers computed from the entries themselves (backfill, and books without counters). */
export function countEntries(entries: Counted[]) {
  const rated = entries.flatMap((entry) => (entry.rating ? [entry.rating] : []));
  const details = { ratingStars: [0, 0, 0, 0, 0], feelingCounts: {}, feelingReaders: 0 };
  for (const entry of entries) addDetails(details, entry, 1);
  return {
    readerCount: entries.length,
    ratingSum: rated.reduce((sum, rating) => sum + rating, 0),
    ratingCount: rated.length,
    ...details,
  };
}
