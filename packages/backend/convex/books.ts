import { bookSearchQuerySchema } from "@grimo/core";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { postView } from "./model/content";
import { parse } from "./model/errors";
import { fetchWork, searchOpenLibrary } from "./model/openLibrary";
import { authorOf, getViewer } from "./model/readers";
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

    const [entries, reviewPosts] = await Promise.all([
      ctx.db
        .query("shelfEntries")
        .withIndex("by_book", (q) => q.eq("bookId", row._id))
        .collect(),
      ctx.db
        .query("posts")
        .withIndex("by_book_kind", (q) => q.eq("bookId", row._id).eq("kind", "review"))
        .order("desc")
        .take(20),
    ]);
    const entry = viewer ? entries.find((item) => item.userId === viewer._id) : undefined;
    const ratings = entries.flatMap((item) => (item.rating ? [item.rating] : []));
    const average = ratings.length
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : null;
    const reviews = await Promise.all(
      reviewPosts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        return author
          ? { ...(await postView(ctx, post, viewer?._id ?? null)), author: authorOf(author) }
          : null;
      }),
    );
    return {
      detail: {
        book,
        entry: entry ? entryView(entry) : null,
        community: {
          readers: entries.length,
          ratings: ratings.length,
          averageRating: average === null ? null : Math.round(average * 10) / 10,
        },
        reviews: reviews.filter((review) => review !== null),
      },
      needsWork,
    };
  },
});
