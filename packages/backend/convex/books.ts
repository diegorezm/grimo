import {
  bookInputSchema,
  bookSearchQuerySchema,
  manualBookSchema,
  newManualBookId,
  type ShelfStatus,
} from "@grimo/core";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server";
import { communityFromCounters, countEntries } from "./model/bookStats";
import { postView } from "./model/content";
import { parse, unauthenticated } from "./model/errors";
import { friendsWantingBook } from "./model/friends";
import { fetchBook, fetchWork, searchOpenLibrary } from "./model/openLibrary";
import { enforceRateLimit } from "./model/rateLimit";
import { authorOf, getViewer, requireVerifiedViewer } from "./model/readers";
import { blockedIds, isBookVisible, isHidden } from "./model/safety";
import { addToShelf, bookByOpenLibraryId, bookView, entryView } from "./model/shelves";
import { bookInput, shelfStatus, workDetails } from "./schema";

/** The signed-in reader's auth id: Open Library lookups are for readers only. */
async function requireIdentity(ctx: {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
}) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw unauthenticated();
  return identity.subject;
}

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
    const reader = await requireIdentity(ctx);
    const query = parse(bookSearchQuerySchema, args).q.toLowerCase();
    await enforceRateLimit(ctx, "bookSearch", reader);
    // Hand-added books moderation approved come first: Open Library doesn't have them.
    const [cached, local] = await Promise.all([
      ctx.runQuery(internal.books.cachedSearch, { query }),
      ctx.runQuery(internal.books.searchApproved, { query }),
    ]);
    if (cached && Date.now() - cached.fetchedAt < SEARCH_TTL) {
      return { items: [...local, ...cached.items] };
    }
    const items = await searchOpenLibrary(query);
    await ctx.runMutation(internal.books.saveSearch, { query, items });
    return { items: [...local, ...items] };
  },
});

/** Approved hand-added books whose title matches, as search results. */
export const searchApproved = internalQuery({
  args: { query: v.string() },
  handler: async (ctx, { query }) => {
    const rows = await ctx.db
      .query("books")
      .withSearchIndex("search_title", (q) =>
        q.search("title", query).eq("reviewStatus", "approved"),
      )
      .take(5);
    return rows.map((book) => ({
      openLibraryId: book.openLibraryId,
      title: book.title,
      authors: book.authors,
      coverUrl: book.coverUrl,
      pageCount: book.pageCount,
      publishedYear: book.publishedYear,
      genres: book.genres,
    }));
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
    const reader = await requireIdentity(ctx);
    if (!/^OL\d+W$/.test(openLibraryId)) return null;
    await enforceRateLimit(ctx, "loadWork", reader);
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
    // A hand-added book in review (or rejected) is only there for whoever added it.
    if (row && !isBookVisible(row, viewer?._id ?? null)) return { detail: null, needsWork: false };
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
      /** Hand-added: "pending" (only you see it), "approved" or "rejected". Null for Open Library's. */
      reviewStatus: row?.reviewStatus ?? null,
    };
    if (!row) {
      return {
        detail: {
          book,
          entry: null,
          community: { readers: 0, ratings: 0, averageRating: null },
          reviews: [],
          quotes: [],
          friendsWant: [],
        },
        needsWork,
      };
    }

    const postsOf = (kind: "review" | "quote") =>
      ctx.db
        .query("posts")
        .withIndex("by_book_kind", (q) => q.eq("bookId", row._id).eq("kind", kind))
        .order("desc")
        .take(20);
    const [entry, counted, reviewPosts, quotePosts, blocked, friendsWant] = await Promise.all([
      viewer
        ? ctx.db
            .query("shelfEntries")
            .withIndex("by_user_book", (q) => q.eq("userId", viewer._id).eq("bookId", row._id))
            .unique()
        : null,
      communityOf(ctx, row),
      postsOf("review"),
      postsOf("quote"),
      blockedIds(ctx, viewer?._id ?? null),
      viewer ? friendsWantingBook(ctx, viewer._id, row._id) : [],
    ]);
    const withAuthors = async (posts: Doc<"posts">[]) => {
      const views = await Promise.all(
        posts.map(async (post) => {
          const author = await ctx.db.get(post.authorId);
          // Like everywhere else: nothing from hidden readers, or between blocked readers.
          return author && !isHidden(author) && !blocked.has(author._id)
            ? { ...(await postView(ctx, post, viewer?._id ?? null)), author: authorOf(author) }
            : null;
        }),
      );
      return views.filter((view) => view !== null);
    };
    const [reviews, quotes] = await Promise.all([
      withAuthors(reviewPosts),
      withAuthors(quotePosts),
    ]);
    return {
      detail: {
        book,
        entry: entry ? entryView(entry) : null,
        community: counted,
        reviews,
        /** Passages readers saved, with their pages. */
        quotes,
        /** People you follow with the book on "Quero ler". */
        friendsWant,
      },
      needsWork,
    };
  },
});

/**
 * "Cadastrar livro": a book Open Library doesn't have, added by hand and put on your shelf. It
 * waits for moderation (`moderation.reviewBook`): until approved only you see it.
 */
export const addManual = mutation({
  args: {
    title: v.string(),
    authors: v.array(v.string()),
    pageCount: v.union(v.number(), v.null()),
    publishedYear: v.union(v.number(), v.null()),
    status: shelfStatus,
  },
  handler: async (ctx, { status, ...args }) => {
    const viewer = await requireVerifiedViewer(ctx);
    const input = parse(manualBookSchema, args);
    await enforceRateLimit(ctx, "addBook", viewer._id);
    const random = () => crypto.getRandomValues(new Uint32Array(1))[0]! / 2 ** 32;
    let openLibraryId = newManualBookId(random);
    while (await bookByOpenLibraryId(ctx, openLibraryId)) openLibraryId = newManualBookId(random);
    await ctx.db.insert("books", {
      openLibraryId,
      title: input.title,
      authors: input.authors,
      coverUrl: null,
      pageCount: input.pageCount,
      publishedYear: input.publishedYear,
      genres: [],
      readerCount: 0,
      ratingSum: 0,
      ratingCount: 0,
      createdBy: viewer._id,
      reviewStatus: "pending",
    });
    const book = (await bookByOpenLibraryId(ctx, openLibraryId))!;
    const { id: _id, ...bookInputFields } = bookView(book);
    await addToShelf(ctx, viewer._id, { book: bookInputFields, status: status as ShelfStatus });
    return { openLibraryId };
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
