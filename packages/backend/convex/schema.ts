import {
  ACTIVITY_KINDS,
  BOOK_REVIEW_STATUSES,
  FEELINGS,
  LEGAL_DOCUMENTS,
  NOTIFICATION_KINDS,
  POST_KINDS,
  REPORT_REASONS,
  REPORT_STATUSES,
  REPORT_TARGETS,
  SHELF_DECOR,
  SHELF_LAYOUTS,
  SHELF_LIGHTS,
  SHELF_MATERIALS,
  SHELF_MODELS,
  SHELF_SORTS,
  SHELF_STATUSES,
  SPINE_FINISHES,
} from "@grimo/core";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/** `v.union(v.literal(...))` from a core constant, so enums have one source of truth. */
const literals = <T extends string>(values: readonly T[]) =>
  v.union(...values.map((value) => v.literal(value)));

export const shelfStatus = literals(SHELF_STATUSES);
export const bookReviewStatus = literals(BOOK_REVIEW_STATUSES);
export const postKind = literals(POST_KINDS);
export const activityKind = literals(ACTIVITY_KINDS);
export const feeling = literals(FEELINGS);
export const legalDocument = literals(LEGAL_DOCUMENTS);
export const notificationKind = literals(NOTIFICATION_KINDS);
export const reportTarget = literals(REPORT_TARGETS);
export const reportReason = literals(REPORT_REASONS);
export const reportStatus = literals(REPORT_STATUSES);
/** How a shelf looks (`@grimo/core` shelves/style). */
export const shelfStyle = v.object({
  model: literals(SHELF_MODELS),
  material: literals(SHELF_MATERIALS),
  finish: literals(SPINE_FINISHES),
  layout: literals(SHELF_LAYOUTS),
  sort: literals(SHELF_SORTS),
  decor: v.array(literals(SHELF_DECOR)),
  light: literals(SHELF_LIGHTS),
});

export const moderationLogAction = v.union(
  v.literal("dismiss"),
  v.literal("remove"),
  v.literal("suspend"),
  v.literal("unsuspend"),
  v.literal("book_approve"),
  v.literal("book_reject"),
  v.literal("role_grant"),
  v.literal("role_revoke"),
);

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

/** A book read from another app's export (`@grimo/core` `importedBookSchema`). */
export const importedBook = v.object({
  title: v.string(),
  authors: v.array(v.string()),
  isbn13: v.union(v.string(), v.null()),
  isbn10: v.union(v.string(), v.null()),
  status: shelfStatus,
  rating: v.union(v.number(), v.null()),
  finishedAt: v.union(v.number(), v.null()),
  pageCount: v.union(v.number(), v.null()),
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
    /** Profile personalization (`@grimo/core` profile/personalize). All optional. */
    pronouns: v.optional(v.string()),
    /** One of `PROFILE_COLORS`: the profile cover. */
    profileColor: v.optional(v.string()),
    /**
     * "Trilha da leitura": a link the apps open (never an embedded player). The cover is copied
     * into our storage (`songs.storeCover`), so opening a profile loads nothing from the music
     * service; `color` is the card background taken from it.
     */
    profileSong: v.optional(
      v.object({
        title: v.string(),
        artist: v.string(),
        url: v.string(),
        coverStorageId: v.optional(v.id("_storage")),
        color: v.optional(v.string()),
      }),
    ),
    /** "Livros de cabeceira", in order (at most `MAX_FAVORITE_BOOKS`). */
    favoriteBookIds: v.optional(v.array(v.id("books"))),
    /** One of the reader's own quotes, highlighted on the profile. */
    featuredQuoteId: v.optional(v.id("posts")),
    /** Which reading cards the profile shows (absent: `DEFAULT_PROFILE_SHOWS`). */
    profileShows: v.optional(
      v.object({ goal: v.boolean(), reading: v.boolean(), streak: v.boolean() }),
    ),
    /** How "Todos os meus livros" looks (absent: the default style). */
    shelfStyle: v.optional(shelfStyle),
    /**
     * Private profile: only approved followers see the reader's shelf, stats, activity, posts
     * and lists (`canSeeReader`); following them is a request (`followRequests`).
     */
    isPrivate: v.optional(v.boolean()),
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
    /**
     * Whether the sign-in email was verified (synced from Better Auth; Google accounts come
     * verified). Absent until `migrations.backfillEmailVerified` reaches an older account.
     */
    emailVerified: v.optional(v.boolean()),
    /** IANA zone (`America/Sao_Paulo`) for months and years of reading; sent by the apps. */
    timeZone: v.optional(v.string()),
    /** Declared under 16: the account can't be used, only deleted. */
    ageRejectedAt: v.optional(v.number()),
    /** Suspended by moderation (`moderation.suspend`): hidden, and signed-in calls fail. */
    suspendedAt: v.optional(v.number()),
    /** When a temporary suspension ends; absent while suspended means permanent. */
    suspendedUntil: v.optional(v.number()),
    /** Why, shown to the suspended reader. */
    suspendReason: v.optional(v.string()),
    /**
     * Moderation team: opens `/admin` (`moderation.queue`). Admins are set with
     * `moderation:setAdmin`; moderators by invite (or `moderation:setModerator`).
     */
    role: v.optional(v.union(v.literal("admin"), v.literal("moderator"))),
    /** Account deleted: hidden while `account.purge` erases its data (then the row goes too). */
    deletedAt: v.optional(v.number()),
  })
    .index("by_authId", ["authId"])
    .index("by_username", ["username"])
    .index("by_followers", ["followers"])
    .index("by_role", ["role"])
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
    /** Ratings in each star bar (1 to 5; half stars count in the bar below). */
    ratingStars: v.optional(v.array(v.number())),
    /** Readers who picked each feeling when rating, and how many picked any. */
    feelingCounts: v.optional(v.record(v.string(), v.number())),
    feelingReaders: v.optional(v.number()),
    /** Shelf entries of the book per status (want_to_read, reading, read, abandoned). */
    statusCounts: v.optional(v.record(v.string(), v.number())),
    /**
     * Hand-added books (`GR…` ids, `books.addManual`): who added it and the moderation review.
     * Until approved only that reader sees it. Absent on Open Library books.
     */
    createdBy: v.optional(v.id("users")),
    reviewStatus: v.optional(bookReviewStatus),
  })
    .index("by_openLibraryId", ["openLibraryId"])
    .index("by_createdBy", ["createdBy"])
    .index("by_reviewStatus", ["reviewStatus"])
    .searchIndex("search_title", { searchField: "title", filterFields: ["reviewStatus"] }),

  /** A book on a reader's shelf. One per (user, book). */
  shelfEntries: defineTable({
    userId: v.id("users"),
    bookId: v.id("books"),
    status: shelfStatus,
    currentPage: v.number(),
    /** Furthest page logged, so going back and forward again isn't counted twice. */
    maxPage: v.optional(v.number()),
    /** Pages in this reader's edition, when it differs from the book's (absent: the book's). */
    pageCount: v.optional(v.number()),
    rating: v.union(v.number(), v.null()),
    /** How the book made the reader feel, picked with the rating. */
    feelings: v.optional(v.array(feeling)),
    startedAt: v.union(v.number(), v.null()),
    finishedAt: v.union(v.number(), v.null()),
    /** Earlier readings of this book (rereads), kept in `pastReadings`. */
    pastReads: v.optional(v.number()),
    updatedAt: v.number(),
    /** The reader's own tags on this book ("Tenho", "Kindle"): filters of the shelf. */
    tagIds: v.optional(v.array(v.id("shelfTags"))),
  })
    .index("by_user_book", ["userId", "bookId"])
    .index("by_user_updated", ["userId", "updatedAt"])
    .index("by_user_status_updated", ["userId", "status", "updatedAt"])
    .index("by_user_status_finished", ["userId", "status", "finishedAt"])
    .index("by_book", ["bookId"]),

  /**
   * A shelf the reader makes ("Física", "Kindle", "Emprestei"). Its books are the shelf entries
   * whose `tagIds` hold it, so a book can be on many shelves. See `bookshelves.ts`.
   */
  shelfTags: defineTable({
    userId: v.id("users"),
    name: v.string(),
    createdAt: v.number(),
    /** Shown on the profile (only books read or being read); absent or false: only the reader. */
    isPublic: v.optional(v.boolean()),
    /** How the bookcase looks (absent: the default style). */
    style: v.optional(shelfStyle),
  }).index("by_user", ["userId"]),

  /**
   * Removed: named filters, replaced by the shelves the reader makes. Kept only until
   * `migrations.savedShelvesToShelves` turned each into a shelf on every deployment.
   */
  savedShelves: defineTable({
    userId: v.id("users"),
    name: v.string(),
    filter: v.object({
      statuses: v.array(shelfStatus),
      genres: v.array(v.string()),
      tagIds: v.array(v.id("shelfTags")),
    }),
    /** Shown on the profile to everyone (without "Quero ler"); false: only the reader. */
    isPublic: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  /**
   * A finished reading of a book the reader is reading again (moved from "Lido" back to
   * "Lendo"): its dates and rating, so the year it was read keeps counting it.
   */
  pastReadings: defineTable({
    userId: v.id("users"),
    shelfEntryId: v.id("shelfEntries"),
    bookId: v.id("books"),
    startedAt: v.union(v.number(), v.null()),
    finishedAt: v.number(),
    rating: v.union(v.number(), v.null()),
  })
    .index("by_user_finished", ["userId", "finishedAt"])
    .index("by_entry", ["shelfEntryId"]),

  /** Append-only progress log: source of truth for "pages read". */
  readingLogs: defineTable({
    userId: v.id("users"),
    shelfEntryId: v.id("shelfEntries"),
    page: v.number(),
    pagesRead: v.number(),
    /** How the reader felt at this page (the diary the rating suggests feelings from). */
    feelings: v.optional(v.array(feeling)),
    createdAt: v.number(),
  })
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_entry", ["shelfEntryId"]),

  /**
   * Timed reading ("sessão de leitura"): open while `endedAt` is null (one per reader). The
   * timer lives here, so it survives closing the app and shows on every device.
   */
  readingSessions: defineTable({
    userId: v.id("users"),
    shelfEntryId: v.id("shelfEntries"),
    bookId: v.id("books"),
    startedAt: v.number(),
    endedAt: v.union(v.number(), v.null()),
    startPage: v.number(),
    endPage: v.union(v.number(), v.null()),
  })
    .index("by_user_ended", ["userId", "endedAt"])
    .index("by_user_started", ["userId", "startedAt"])
    .index("by_entry", ["shelfEntryId"]),

  /**
   * Removed from the app (saved shelves and tags replace them). Kept only until
   * `migrations.dropLists` has emptied them on every deployment; then both tables go.
   */
  lists: defineTable({
    ownerId: v.id("users"),
    title: v.string(),
    description: v.string(),
    itemCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_owner_updated", ["ownerId", "updatedAt"]),

  listItems: defineTable({
    listId: v.id("lists"),
    bookId: v.id("books"),
    /** Why the book is on the list, in a line. */
    note: v.union(v.string(), v.null()),
    addedAt: v.number(),
  })
    .index("by_list_added", ["listId", "addedAt"])
    .index("by_list_book", ["listId", "bookId"]),

  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
  })
    .index("by_follower", ["followerId"])
    .index("by_follower_following", ["followerId", "followingId"])
    .index("by_following", ["followingId"]),

  /** Someone asking to follow a private reader; becomes a `follows` row when accepted. */
  followRequests: defineTable({
    requesterId: v.id("users"),
    targetId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_requester_target", ["requesterId", "targetId"])
    .index("by_target_created", ["targetId", "createdAt"]),

  /** Reviews (book + rating) and free-form reading notes. */
  posts: defineTable({
    authorId: v.id("users"),
    bookId: v.union(v.id("books"), v.null()),
    kind: postKind,
    rating: v.union(v.number(), v.null()),
    body: v.string(),
    hasSpoilers: v.boolean(),
    /** Where a quote is in the book. */
    page: v.optional(v.union(v.number(), v.null())),
    likeCount: v.number(),
    commentCount: v.number(),
  })
    .index("by_author", ["authorId"])
    .index("by_author_book_kind", ["authorId", "bookId", "kind"])
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
    .index("by_created", ["createdAt"])
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
   * A shelf import from another app (`imports.ts`). Its rows are worked through in the
   * background and deleted as they go; what's left is the summary (and up to 100 titles Open
   * Library didn't know, so the reader can add them by hand).
   */
  imports: defineTable({
    userId: v.id("users"),
    source: v.literal("goodreads"),
    total: v.number(),
    processed: v.number(),
    added: v.number(),
    /** Already on the shelf: left as they were. */
    skipped: v.number(),
    notFound: v.array(v.string()),
    notFoundCount: v.number(),
    status: v.union(v.literal("running"), v.literal("done")),
    createdAt: v.number(),
    finishedAt: v.union(v.number(), v.null()),
  }).index("by_user_created", ["userId", "createdAt"]),

  importRows: defineTable({
    importId: v.id("imports"),
    index: v.number(),
    book: importedBook,
    /** Open Library lookups that failed (network): retried, then given up as not found. */
    attempts: v.number(),
  }).index("by_import_index", ["importId", "index"]),

  /**
   * Juntos: a few readers reading one book together (`groups.ts`). Joined by invite link
   * (`/j/<inviteCode>`); joining puts the book on your "Lendo" shelf.
   */
  groups: defineTable({
    bookId: v.id("books"),
    /** Who created it (or the earliest member left, once they leave): sets the date. */
    ownerId: v.id("users"),
    inviteCode: v.string(),
    /** "Terminar até": end of that day, epoch ms. */
    finishBy: v.union(v.number(), v.null()),
    /** Denormalized, kept by join/leave. */
    memberCount: v.number(),
    createdAt: v.number(),
    lastMessageAt: v.union(v.number(), v.null()),
    /** A "leitura aberta": listed for everyone, joined without an invite. */
    isOpen: v.optional(v.boolean()),
  })
    .index("by_inviteCode", ["inviteCode"])
    .index("by_book_open", ["bookId", "isOpen", "createdAt"])
    .index("by_open_created", ["isOpen", "createdAt"]),

  groupMembers: defineTable({
    groupId: v.id("groups"),
    userId: v.id("users"),
    joinedAt: v.number(),
  })
    .index("by_group", ["groupId", "joinedAt"])
    .index("by_user", ["userId", "joinedAt"])
    .index("by_group_user", ["groupId", "userId"]),

  /**
   * The group's conversation. `percent` is how far the author had read when writing: the message
   * only opens to members who have read as far (no spoilers).
   */
  groupMessages: defineTable({
    groupId: v.id("groups"),
    authorId: v.id("users"),
    body: v.string(),
    percent: v.number(),
    createdAt: v.number(),
  })
    .index("by_group_created", ["groupId", "createdAt"])
    .index("by_author", ["authorId"]),

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
    .index("by_reporter_target", ["reporterId", "target", "targetId"])
    .index("by_target_user", ["targetUserId", "createdAt"])
    .index("by_target", ["target", "targetId"]),

  /**
   * An admin's invite for one specific reader to become a moderator. Valid for 24 h
   * (`expiresAt`); a `pending` one past that is expired (checked when read, no cron). Kept as the
   * record of who was invited by whom; `invitedBy` goes null when the admin's account is deleted.
   */
  moderatorInvites: defineTable({
    userId: v.id("users"),
    invitedBy: v.union(v.id("users"), v.null()),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("revoked"),
      v.literal("expired"),
    ),
    createdAt: v.number(),
    expiresAt: v.number(),
    respondedAt: v.union(v.number(), v.null()),
  })
    .index("by_user_status", ["userId", "status"])
    .index("by_status_created", ["status", "createdAt"])
    .index("by_invitedBy", ["invitedBy"]),

  /**
   * Who did what in moderation (admin-only history). `actorId` is null for the CLI and once the
   * moderator's account is deleted; `targetUserId` likewise for the reader acted on.
   */
  moderationLog: defineTable({
    actorId: v.union(v.id("users"), v.null()),
    action: moderationLogAction,
    targetUserId: v.union(v.id("users"), v.null()),
    /** Reported thing or book id, when the action had one. */
    targetId: v.union(v.string(), v.null()),
    /** Suspension length / reason, or the role granted. */
    details: v.union(v.string(), v.null()),
    createdAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_actor", ["actorId"])
    .index("by_targetUser", ["targetUserId"]),

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
