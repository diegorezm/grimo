import type { ActivityKind } from "../stats/activity";
import type { ShelfStatus } from "./constants";
import { MAX_CURRENT_PAGE, type UpdateShelfEntryInput } from "./schemas";

export interface ShelfEntryState {
  status: ShelfStatus | null;
  currentPage: number;
  /** Furthest page ever logged; absent on entries from before it existed (= `currentPage`). */
  maxPage?: number;
  startedAt: Date | null;
}

export interface ShelfTransition {
  /** Fields to persist on the shelf entry. */
  set: UpdateShelfEntryInput;
  /** Pages advanced by this change (for the reading log / stats). */
  pagesRead: number;
  /** New furthest page: going back and forward again never counts the same pages twice. */
  maxPage: number;
  /** Feed activity to emit, if any. */
  activity: ActivityKind | null;
  /**
   * A read book going back to "Lendo": a reread. The finished reading is kept apart (dates and
   * rating) and this one starts over from page 0.
   */
  reread: boolean;
}

/** Pages of the reader's edition when they set one, else the book's. */
export const editionPages = (entryPages: number | null | undefined, bookPages: number | null) =>
  entryPages ?? bookPages;

/**
 * Business rules for moving a book between shelves / updating progress.
 * Pure so it can run on the API and in clients (optimistic updates).
 * `prev.status === null` means the book is being added for the first time. `pageCount` is the
 * reader's edition after the patch (`editionPages`).
 */
export function planShelfTransition(
  prev: ShelfEntryState,
  patch: UpdateShelfEntryInput,
  pageCount: number | null,
  now: Date,
): ShelfTransition {
  const set: UpdateShelfEntryInput = { ...patch };
  if (set.currentPage !== undefined) {
    set.currentPage = Math.min(set.currentPage, pageCount ?? MAX_CURRENT_PAGE);
  } else if (patch.pageCount !== undefined && pageCount && prev.currentPage > pageCount) {
    // A shorter edition: the bookmark moves to its last page.
    set.currentPage = pageCount;
  }
  const status = patch.status ?? prev.status;
  const statusChanged = patch.status !== undefined && patch.status !== prev.status;
  const reread = statusChanged && prev.status === "read" && patch.status === "reading";
  if (reread) {
    if (patch.startedAt === undefined) set.startedAt = now;
    if (patch.finishedAt === undefined) set.finishedAt = null;
    if (set.currentPage === undefined) set.currentPage = 0;
  }
  const keepsStartDate = reread || prev.startedAt !== null || patch.startedAt !== undefined;

  if ((status === "reading" || status === "read") && !keepsStartDate) set.startedAt = now;

  if (statusChanged && patch.status === "read") {
    if (patch.finishedAt === undefined) set.finishedAt = now;
    if (patch.currentPage === undefined && pageCount) set.currentPage = pageCount;
  }

  // A reread counts its pages again.
  const before = reread ? 0 : Math.max(prev.maxPage ?? 0, prev.currentPage);
  const after = set.currentPage ?? prev.currentPage;
  const pagesRead = Math.max(0, after - before);
  const maxPage = Math.max(before, after);

  let activity: ActivityKind | null = null;
  if (statusChanged) activity = patch.status === "read" ? "finished" : "shelved";
  else if (pagesRead > 0) activity = "progress";

  return { set, pagesRead, maxPage, activity, reread };
}
