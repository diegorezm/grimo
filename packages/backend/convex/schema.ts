import {
  ACTIVITY_KINDS,
  LEGAL_DOCUMENTS,
  NOTIFICATION_KINDS,
  POST_KINDS,
  REPORT_REASONS,
  REPORT_STATUSES,
  REPORT_TARGETS,
  SHELF_STATUSES,
} from "@grimo/core";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/** `v.union(v.literal(...))` from a core constant, so enums have one source of truth. */
const literals = <T extends string>(values: readonly T[]) =>
  v.union(...values.map((value) => v.literal(value)));

export const shelfStatus = literals(SHELF_STATUSES);
export const postKind = literals(POST_KINDS);
export const activityKind = literals(ACTIVITY_KINDS);
export const legalDocument = literals(LEGAL_DOCUMENTS);
export const notificationKind = literals(NOTIFICATION_KINDS);
export const reportTarget = literals(REPORT_TARGETS);
export const reportReason = literals(REPORT_REASONS);
export const reportStatus = literals(REPORT_STATUSES);

/** A book as returned by search: enough to save it locally. */
export const bookInput = v.object({
  openLibraryId: v.string(),
  title: v.string(),
  authors: v.array(v.string()),
  coverUrl: v.union(v.string(), v.null()),
  pageCount: v.union(v.number(), v.null()),
  publishedYear: v.union(v.number(), v.null()),
  genres: v.array(v.string()),
});

/** Open Library work page (synopsis, cover, authors). */
export const workDetails = v.object({
  title: v.union(v.string(), v.null()),
  description: v.union(v.string(), v.null()),
  coverUrl: v.union(v.string(), v.null()),
  genres: v.array(v.string()),
  publishedYear: v.union(v.number(), v.null()),
  authors: v.array(v.string()),
});

/**
 * Dates are epoch milliseconds. Accounts (email, password, sessions) live in the Better Auth
 * component; `users` is the app-side reader, created by its trigger (convex/auth.ts).
 */
export default defineSchema({
  users: defineTable({
    /** Better Auth user id (the JWT `sub`). */
    authId: v.string(),
    name: v.string(),
    /** Lowercase, unique (enforced by Better Auth's username plugin). */
    username: v.string(),
    image: v.union(v.string(), v.null()),
    /**
     * Photo the reader uploaded (Convex file storage). While set, `image` is its URL and the
     * auth provider's picture (e.g. Google) no longer overwrites it.
     */
    avatarStorageId: v.optional(v.id("_storage")),
    bio: v.union(v.string(), v.null()),
    favoriteGenres: v.array(v.string()),
    /** Denormalized counters, kept by the follow/shelf mutations. */
    followers: v.number(),
    following: v.number(),
    bookCount: v.number(),
    /** `name username`, for the reader search index. */
    searchText: v.string(),
    /**
     * False until the reader confirms name and @ in the onboarding. Absent on accounts created
     * before the onboarding existed (treated as done).
     */
    setupDone: v.optional(v.boolean()),
    /** When the reader declared being 16+ (the birth date itself is never stored). */
    ageConfirmedAt: v.optional(v.number()),
    /** IANA zone (`America/Sao_Paulo`) for months and years of reading; sent by the apps. */
    timeZone: v.optional(v.string()),
    /** Declared under 16: the account can't be used, only deleted. */
    ageRejectedAt: v.optional(v.number()),
    /** Suspended by moderation (`moderation.suspend`): hidden, and signed-in calls fail. */
    suspendedAt: v.optional(v.number()),
    /** Account deleted: hidden while `account.purge` erases its data (then the row goes too). */
    deletedAt: v.optional(v.number()),
  })
    .index("by_authId", ["authId"])
    .index("by_username", ["username"])
    .index("by_followers", ["followers"])
    .searchIndex("search", { searchField: "searchText" }),

  readingGoals: defineTable({
    userId: v.id("users"),
    year: v.number(),
    target: v.number(),
  }).index("by_user_year", ["userId", "year"]),

  /** Local copy of books users interacted with (source: Open Library). Not a catalog. */
  books: defineTable({
    openLibraryId: v.string(),
    title: v.string(),
    authors: v.array(v.string()),
    coverUrl: v.union(v.string(), v.null()),
    pageCount: v.union(v.number(), v.null()),
    publishedYear: v.union(v.number(), v.null()),
    genres: v.array(v.string()),
    /**
     * Community numbers, kept by the shelf mutations (`model/bookStats.ts`). Absent until
     * `migrations.backfillBookCounters` has run on the book; readers fall back to counting.
     */
    readerCount: v.optional(v.number()),
    ratingSum: v.optional(v.number()),
    ratingCount: v.optional(v.number()),
  }).index("by_openLibraryId", ["openLibraryId"]),

  /** A book on a reader's shelf. One per (user, book). */
  shelfEntries: defineTable({
    userId: v.id("users"),
    bookId: v.id("books"),
    status: shelfStatus,
    currentPage: v.number(),
    /** Furthest page logged, so going back and forward again isn't counted twice. */
    maxPage: v.optional(v.number()),
    rating: v.union(v.number(), v.null()),
    startedAt: v.union(v.number(), v.null()),
    finishedAt: v.union(v.number(), v.null()),
    updatedAt: v.number(),
  })
    .index("by_user_book", ["userId", "bookId"])
    .index("by_user_updated", ["userId", "updatedAt"])
    .index("by_user_status_updated", ["userId", "status", "updatedAt"])
    .index("by_user_status_finished", ["userId", "status", "finishedAt"])
    .index("by_book", ["bookId"]),

  /** Append-only progress log: source of truth for "pages read". */
  readingLogs: defineTable({
    userId: v.id("users"),
    shelfEntryId: v.id("shelfEntries"),
    page: v.number(),
    pagesRead: v.number(),
    createdAt: v.number(),
  })
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_entry", ["shelfEntryId"]),

  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
  })
    .index("by_follower", ["followerId"])
    .index("by_follower_following", ["followerId", "followingId"])
    .index("by_following", ["followingId"]),

  /** Reviews (book + rating) and free-form reading notes. */
  posts: defineTable({
    authorId: v.id("users"),
    bookId: v.union(v.id("books"), v.null()),
    kind: postKind,
    rating: v.union(v.number(), v.null()),
    body: v.string(),
    hasSpoilers: v.boolean(),
    likeCount: v.number(),
    commentCount: v.number(),
  })
    .index("by_author", ["authorId"])
    .index("by_book_kind", ["bookId", "kind"]),

  postLikes: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
  })
    .index("by_post_user", ["postId", "userId"])
    .index("by_user", ["userId"]),

  postComments: defineTable({
    postId: v.id("posts"),
    authorId: v.id("users"),
    body: v.string(),
  })
    .index("by_post", ["postId"])
    .index("by_author", ["authorId"]),

  /** Feed events. The feed is fan-out-on-read: activities of the people you follow. */
  activities: defineTable({
    actorId: v.id("users"),
    kind: activityKind,
    bookId: v.union(v.id("books"), v.null()),
    postId: v.union(v.id("posts"), v.null()),
    targetUserId: v.union(v.id("users"), v.null()),
    /** Small denormalized extras (e.g. `{ status, page }` for progress). */
    data: v.union(v.record(v.string(), v.any()), v.null()),
    createdAt: v.number(),
  })
    .index("by_actor_created", ["actorId", "createdAt"])
    .index("by_post", ["postId"])
    .index("by_actor_target", ["actorId", "targetUserId"]),

  /**
   * "Rafa curtiu sua resenha": what others did that concerns `userId`. Written by the follow,
   * like, comment and post mutations, and taken back when the like/follow/comment/post goes.
   */
  notifications: defineTable({
    /** Who is notified. */
    userId: v.id("users"),
    actorId: v.id("users"),
    kind: notificationKind,
    postId: v.union(v.id("posts"), v.null()),
    commentId: v.union(v.id("postComments"), v.null()),
    createdAt: v.number(),
    readAt: v.union(v.number(), v.null()),
  })
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_user_read", ["userId", "readAt"])
    .index("by_actor_post", ["actorId", "postId"])
    .index("by_post", ["postId"])
    .index("by_comment", ["commentId"]),

  /**
   * Proof that a reader agreed to a version of a legal document (append-only). The latest row per
   * document is compared with the current version (`@grimo/core` CURRENT_LEGAL_VERSIONS).
   */
  legalAcceptances: defineTable({
    userId: v.id("users"),
    document: legalDocument,
    version: v.string(),
    acceptedAt: v.number(),
    /** Where it was accepted: "web" | "ios" | "android". */
    source: v.string(),
  }).index("by_user_document", ["userId", "document"]),

  /** `blockerId` blocked `blockedId`: no follows between them, each other's content hidden. */
  blocks: defineTable({
    blockerId: v.id("users"),
    blockedId: v.id("users"),
  })
    .index("by_blocker_blocked", ["blockerId", "blockedId"])
    .index("by_blocked", ["blockedId"]),

  /**
   * Reports of posts, comments and readers (moderation queue, reviewed in the Convex dashboard).
   * Kept after the content or the reporter is gone: they are the record that we acted.
   */
  reports: defineTable({
    /** Null once the reporter deleted their account. */
    reporterId: v.union(v.id("users"), v.null()),
    target: reportTarget,
    targetId: v.string(),
    /** Who answers for the reported content (the reader, or the post/comment author). */
    targetUserId: v.union(v.id("users"), v.null()),
    reason: reportReason,
    details: v.union(v.string(), v.null()),
    /** Copy of the reported text at report time (posts and comments). */
    snapshot: v.union(v.string(), v.null()),
    status: reportStatus,
    createdAt: v.number(),
    resolvedAt: v.union(v.number(), v.null()),
  })
    .index("by_status_created", ["status", "createdAt"])
    .index("by_reporter_target", ["reporterId", "target", "targetId"]),

  /** Open Library search results, reused for 24 h (see `books.search`). */
  bookSearchCache: defineTable({
    query: v.string(),
    items: v.array(bookInput),
    fetchedAt: v.number(),
  })
    .index("by_query", ["query"])
    .index("by_fetchedAt", ["fetchedAt"]),

  /** Open Library work pages; `details: null` means Open Library doesn't know the id. */
  workCache: defineTable({
    openLibraryId: v.string(),
    details: v.union(workDetails, v.null()),
    fetchedAt: v.number(),
  })
    .index("by_openLibraryId", ["openLibraryId"])
    .index("by_fetchedAt", ["fetchedAt"]),
});
