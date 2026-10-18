import type { ActivityKind } from "../stats/activity";
import type { ShelfStatus } from "./constants";
import type { UpdateShelfEntryInput } from "./schemas";

export interface ShelfEntryState {
  status: ShelfStatus | null;
  currentPage: number;
  startedAt: Date | null;
}

export interface ShelfTransition {
  /** Fields to persist on the shelf entry. */
  set: UpdateShelfEntryInput;
  /** Pages advanced by this change (for the reading log / stats). */
  pagesRead: number;
  /** Feed activity to emit, if any. */
  activity: ActivityKind | null;
}

/**
 * Business rules for moving a book between shelves / updating progress.
 * Pure so it can run on the API and in clients (optimistic updates).
 * `prev.status === null` means the book is being added for the first time.
 */
export function planShelfTransition(
  prev: ShelfEntryState,
  patch: UpdateShelfEntryInput,
  pageCount: number | null,
  now: Date,
): ShelfTransition {
  const set: UpdateShelfEntryInput = { ...patch };
  const status = patch.status ?? prev.status;
  const statusChanged = patch.status !== undefined && patch.status !== prev.status;
  const keepsStartDate = prev.startedAt !== null || patch.startedAt !== undefined;

  if ((status === "reading" || status === "read") && !keepsStartDate) set.startedAt = now;

  if (statusChanged && patch.status === "read") {
    if (patch.finishedAt === undefined) set.finishedAt = now;
    if (patch.currentPage === undefined && pageCount) set.currentPage = pageCount;
  }

  const pagesRead = Math.max(0, (set.currentPage ?? prev.currentPage) - prev.currentPage);

  let activity: ActivityKind | null = null;
  if (statusChanged) activity = patch.status === "read" ? "finished" : "shelved";
  else if (pagesRead > 0) activity = "progress";

  return { set, pagesRead, activity };
}
