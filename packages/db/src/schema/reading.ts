import { SHELF_STATUSES } from "@grimo/core";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { createdAt, id, stringArray, updatedAt } from "./helpers";

/** Reader profile data that is not part of auth (avatar lives in `user.image`). */
export const profiles = sqliteTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  bio: text("bio"),
  favoriteGenres: stringArray("favorite_genres"),
  updatedAt: updatedAt(),
});

export const readingGoals = sqliteTable(
  "reading_goals",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    target: integer("target").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.year] })],
);

/** Local cache of books users interacted with (source: Open Library). Not a catalog. */
export const books = sqliteTable("books", {
  id: id(),
  openLibraryId: text("open_library_id").notNull().unique(),
  title: text("title").notNull(),
  authors: stringArray("authors"),
  coverUrl: text("cover_url"),
  pageCount: integer("page_count"),
  publishedYear: integer("published_year"),
  genres: stringArray("genres"),
  createdAt: createdAt(),
});

/** A book on a user's shelf. One row per (user, book). */
export const shelfEntries = sqliteTable(
  "shelf_entries",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    bookId: text("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    status: text("status", { enum: SHELF_STATUSES }).notNull(),
    currentPage: integer("current_page").notNull().default(0),
    rating: integer("rating"),
    startedAt: integer("started_at", { mode: "timestamp_ms" }),
    finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("shelf_entries_user_book_idx").on(t.userId, t.bookId),
    index("shelf_entries_user_status_idx").on(t.userId, t.status),
  ],
);

/** Append-only progress log — source of truth for "pages read" stats. */
export const readingLogs = sqliteTable(
  "reading_logs",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    shelfEntryId: text("shelf_entry_id")
      .notNull()
      .references(() => shelfEntries.id, { onDelete: "cascade" }),
    page: integer("page").notNull(),
    pagesRead: integer("pages_read").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("reading_logs_user_created_idx").on(t.userId, t.createdAt)],
);
