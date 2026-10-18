import {
  type ActivityKind,
  type BookInput,
  planShelfTransition,
  type ShelfStatus,
  type UpdateShelfEntryInput,
} from "@grimo/core";
import { activities, books, type Database, readingLogs, shelfEntries } from "@grimo/db";
import { and, eq } from "drizzle-orm";
import { notFound } from "../../lib/errors";

/** Inserts the book in the local cache (or refreshes it) and returns its row. */
export async function upsertBook(db: Database, input: BookInput) {
  const [book] = await db
    .insert(books)
    .values(input)
    .onConflictDoUpdate({
      target: books.openLibraryId,
      set: { title: input.title, authors: input.authors, coverUrl: input.coverUrl },
    })
    .returning();
  return book!;
}

async function recordSideEffects(
  db: Database,
  params: {
    userId: string;
    entryId: string;
    bookId: string;
    page: number;
    pagesRead: number;
    activity: ActivityKind | null;
    status: ShelfStatus;
  },
) {
  // D1 has no interactive transactions; these are append-only so ordering is safe.
  if (params.pagesRead > 0) {
    await db.insert(readingLogs).values({
      userId: params.userId,
      shelfEntryId: params.entryId,
      page: params.page,
      pagesRead: params.pagesRead,
    });
  }
  if (params.activity) {
    await db.insert(activities).values({
      actorId: params.userId,
      kind: params.activity,
      bookId: params.bookId,
      data: { status: params.status, page: params.page },
    });
  }
}

export async function addToShelf(
  db: Database,
  userId: string,
  input: { book: BookInput; status: ShelfStatus },
) {
  const book = await upsertBook(db, input.book);
  const existing = await db.query.shelfEntries.findFirst({
    where: and(eq(shelfEntries.userId, userId), eq(shelfEntries.bookId, book.id)),
  });
  if (existing) return updateShelfEntry(db, userId, existing.id, { status: input.status });

  const plan = planShelfTransition(
    { status: null, currentPage: 0, startedAt: null },
    { status: input.status },
    book.pageCount,
    new Date(),
  );
  // Adding a book is always worth a feed entry ("shelved"/"finished").
  const activity = plan.activity ?? "shelved";
  const [entry] = await db
    .insert(shelfEntries)
    .values({ userId, bookId: book.id, status: input.status, ...plan.set })
    .returning();

  await recordSideEffects(db, {
    userId,
    entryId: entry!.id,
    bookId: book.id,
    page: entry!.currentPage,
    pagesRead: plan.pagesRead,
    activity,
    status: entry!.status,
  });
  return entry!;
}

export async function updateShelfEntry(
  db: Database,
  userId: string,
  entryId: string,
  patch: UpdateShelfEntryInput,
) {
  const row = await db
    .select({ entry: shelfEntries, pageCount: books.pageCount })
    .from(shelfEntries)
    .innerJoin(books, eq(books.id, shelfEntries.bookId))
    .where(and(eq(shelfEntries.id, entryId), eq(shelfEntries.userId, userId)))
    .get();
  if (!row) throw notFound("Livro na estante");

  const plan = planShelfTransition(row.entry, patch, row.pageCount, new Date());
  const [entry] = await db
    .update(shelfEntries)
    .set(plan.set)
    .where(eq(shelfEntries.id, entryId))
    .returning();

  await recordSideEffects(db, {
    userId,
    entryId,
    bookId: row.entry.bookId,
    page: entry!.currentPage,
    pagesRead: plan.pagesRead,
    activity: plan.activity,
    status: entry!.status,
  });
  return entry!;
}
