import { bookInputSchema, bookSearchQuerySchema } from "@grimo/core";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  type QueryCtx,
  query,
} from "./_generated/server";
import { communityFromCounters, countEntries } from "./model/bookStats";
import { postView } from "./model/content";
import { parse } from "./model/errors";
import { fetchBook, fetchWork, searchOpenLibrary } from "./model/openLibrary";
import { authorOf, getViewer } from "./model/readers";
import { blockedIds, isHidden } from "./model/safety";
import { entryView } from "./model/shelves";
import { bookInput, workDetails } from "./schema";

const DAY = 24 * 60 * 60 * 1000;
/** Search results are reused for a day (same as the client's `staleTimes.bookSearch`). */
const SEARCH_TTL = DAY;
/** Work pages (synopsis, cover) rarely change. */
const WORK_TTL = 30 * DAY;

/**
 * Book search, proxied to Open Library and cached for 24 h in `bookSearchCache`, so a popular
 * query hits Open Library once a day no matter how many readers type it.
 */
export const search = action({
  args: { q: v.string() },
  handler: async (ctx, args): Promise<{ items: (typeof bookInput.type)[] }> => {
    const query = parse(bookSearchQuerySchema, args).q.toLowerCase();
    const cached = await ctx.runQuery(internal.books.cachedSearch, { query });
    if (cached && Date.now() - cached.fetchedAt < SEARCH_TTL) return { items: cached.items };
    const items = await searchOpenLibrary(query);
    await ctx.runMutation(internal.books.saveSearch, { query, items });
    return { items };
  },
});

export const cachedSearch = internalQuery({
  args: { query: v.string() },
  handler: (ctx, { query }) =>
    ctx.db
      .query("bookSearchCache")
      .withIndex("by_query", (q) => q.eq("query", query))
      .unique(),
});

export const saveSearch = internalMutation({
  args: { query: v.string(), items: v.array(bookInput) },
  handler: async (ctx, { query, items }) => {
    const existing = await ctx.db
      .query("bookSearchCache")
      .withIndex("by_query", (q) => q.eq("query", query))
      .unique();
    if (existing) await ctx.db.patch(existing._id, { items, fetchedAt: Date.now() });
    else await ctx.db.insert("bookSearchCache", { query, items, fetchedAt: Date.now() });
  },
});

/**
 * Fetches the Open Library work page into `workCache`. Clients call it when `detail` says
 * `needsWork`; the reactive `detail` query then updates by itself.
 */
export const loadWork = action({
  args: { openLibraryId: v.string() },
  handler: async (ctx, { openLibraryId }) => {
    if (!/^OL\d+W$/.test(openLibraryId)) return null;
    const cached = await ctx.runQuery(internal.books.cachedWork, { openLibraryId });
    if (cached && Date.now() - cached.fetchedAt < WORK_TTL) return null;
    const details = await fetchWork(openLibraryId);
    // Unreachable is not "unknown": only cache a miss when Open Library answered.
    if (details === undefined) return null;
    await ctx.runMutation(internal.books.saveWork, { openLibraryId, details });
    return null;
  },
});

export const cachedWork = internalQuery({
  args: { openLibraryId: v.string() },
  handler: (ctx, { openLibraryId }) =>
    ctx.db
      .query("workCache")
      .withIndex("by_openLibraryId", (q) => q.eq("openLibraryId", openLibraryId))
      .unique(),
});

export const saveWork = internalMutation({
  args: { openLibraryId: v.string(), details: v.union(workDetails, v.null()) },
  handler: async (ctx, { openLibraryId, details }) => {
    const existing = await ctx.db
      .query("workCache")
      .withIndex("by_openLibraryId", (q) => q.eq("openLibraryId", openLibraryId))
      .unique();
    if (existing) await ctx.db.patch(existing._id, { details, fetchedAt: Date.now() });
    else await ctx.db.insert("workCache", { openLibraryId, details, fetchedAt: Date.now() });
  },
});

/**
 * A book's data comes from the first reader who shelved it (`shelves.add`), and that reader's
 * client can send anything the schema allows. Right after, this replaces it with what Open Library
 * says about the id, so a forged title or author never sticks for everyone else.
 */
export const refreshBook = internalAction({
  args: { openLibraryId: v.string() },
  handler: async (ctx, { openLibraryId }): Promise<null> => {
    const found = await fetchBook(openLibraryId);
    // Unknown or unreachable: keep what was saved (already checked by `bookInputSchema`).
    const book = found ? bookInputSchema.safeParse(found) : null;
    if (!book?.success) return null;
    await ctx.runMutation(internal.books.saveBook, { book: book.data });
    return null;
  },
});

export const saveBook = internalMutation({
  args: { book: bookInput },
  handler: async (ctx, { book }) => {
    const existing = await ctx.db
      .query("books")
      .withIndex("by_openLibraryId", (q) => q.eq("openLibraryId", book.openLibraryId))
      .unique();
    if (existing) await ctx.db.patch(existing._id, book);
    return null;
  },
});

/**
 * Everything the book page shows: the book (our copy, filled in from the Open Library work
 * page), your shelf entry, community numbers and reviews. `detail` is null while the work page
 * is still loading (`needsWork`) or when nobody knows the book (`needsWork: false`).
 */
export const detail = query({
  args: { openLibraryId: v.string() },
  handler: async (ctx, { openLibraryId }) => {
    const [row, cached, viewer] = await Promise.all([
      ctx.db
        .query("books")
        .withIndex("by_openLibraryId", (q) => q.eq("openLibraryId", openLibraryId))
        .unique(),
      ctx.db
        .query("workCache")
        .withIndex("by_openLibraryId", (q) => q.eq("openLibraryId", openLibraryId))
        .unique(),
      getViewer(ctx),
    ]);
    const work = cached?.details ?? null;
    // Freshness is checked by `loadWork`; here only "never fetched" matters.
    const needsWork = !cached && /^OL\d+W$/.test(openLibraryId);
    if (!row && !work?.title) return { detail: null, needsWork };

    const book = {
      id: row?._id ?? null,
      openLibraryId,
      title: row?.title ?? work?.title ?? "",
      authors: row?.authors.length ? row.authors : (work?.authors ?? []),
      coverUrl: row?.coverUrl ?? work?.coverUrl ?? null,
      pageCount: row?.pageCount ?? null,
      publishedYear: row?.publishedYear ?? work?.publishedYear ?? null,
      genres: row?.genres.length ? row.genres : (work?.genres ?? []),
      description: work?.description ?? null,
    };
    if (!row) {
      return {
        detail: {
          book,
          entry: null,
          community: { readers: 0, ratings: 0, averageRating: null },
          reviews: [],
        },
        needsWork,
      };
    }

    const [entry, counted, reviewPosts, blocked] = await Promise.all([
      viewer
        ? ctx.db
            .query("shelfEntries")
            .withIndex("by_user_book", (q) => q.eq("userId", viewer._id).eq("bookId", row._id))
            .unique()
        : null,
      communityOf(ctx, row),
      ctx.db
        .query("posts")
        .withIndex("by_book_kind", (q) => q.eq("bookId", row._id).eq("kind", "review"))
        .order("desc")
        .take(20),
      blockedIds(ctx, viewer?._id ?? null),
    ]);
    const reviews = await Promise.all(
      reviewPosts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        // Like everywhere else: nothing from hidden readers, or between blocked readers.
        return author && !isHidden(author) && !blocked.has(author._id)
          ? { ...(await postView(ctx, post, viewer?._id ?? null)), author: authorOf(author) }
          : null;
      }),
    );
    return {
      detail: {
        book,
        entry: entry ? entryView(entry) : null,
        community: counted,
        reviews: reviews.filter((review) => review !== null),
      },
      needsWork,
    };
  },
});

/** Rows deleted per table per run; a full batch schedules another run. */
const PURGE_BATCH = 200;

/** Cron: deletes search and work cache rows past their TTL (they are refetched on demand). */
export const purgeExpiredCaches = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const searches = await ctx.db
      .query("bookSearchCache")
      .withIndex("by_fetchedAt", (q) => q.lt("fetchedAt", now - SEARCH_TTL))
      .take(PURGE_BATCH);
    const works = await ctx.db
      .query("workCache")
      .withIndex("by_fetchedAt", (q) => q.lt("fetchedAt", now - WORK_TTL))
      .take(PURGE_BATCH);
    for (const row of [...searches, ...works]) await ctx.db.delete(row._id);
    if (searches.length === PURGE_BATCH || works.length === PURGE_BATCH) {
      await ctx.scheduler.runAfter(0, internal.books.purgeExpiredCaches, {});
    }
    return null;
  },
});

/**
 * Readers, ratings and average of a book. Straight from the book's counters; a book the
 * backfill hasn't reached yet is counted from its shelf entries (remove once all are counted).
 */
async function communityOf(ctx: QueryCtx, book: Doc<"books">) {
  const counted = communityFromCounters(book);
  if (counted) return counted;
  const entries = await ctx.db
    .query("shelfEntries")
    .withIndex("by_book", (q) => q.eq("bookId", book._id))
    .collect();
  const { readerCount, ratingSum, ratingCount } = countEntries(entries);
  return communityFromCounters({ ...book, readerCount, ratingSum, ratingCount })!;
}
