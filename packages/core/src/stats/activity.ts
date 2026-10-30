import { SHELF_LABELS, type ShelfStatus } from "../shelves/constants";

export const ACTIVITY_KINDS = ["shelved", "progress", "finished", "posted", "followed"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

/** Human sentence for a feed item (shared copy for web + mobile). */
export function describeActivity(kind: ActivityKind, data: Record<string, unknown> | null): string {
  switch (kind) {
    case "shelved": {
      const status = data?.status as ShelfStatus | undefined;
      return status ? `adicionou à estante “${SHELF_LABELS[status]}”` : "adicionou um livro";
    }
    case "progress":
      return `está na página ${String(data?.page ?? "?")}`;
    case "finished":
      return "terminou de ler";
    case "posted":
      return "publicou";
    case "followed":
      // Clients append the followed reader (like the book title on other kinds).
      return "começou a seguir";
  }
}

/** Same-kind activities closer than this (to the newest one) collapse into one entry. */
const GROUP_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface GroupableActivity {
  id: string;
  kind: ActivityKind;
  data: Record<string, unknown> | null;
  actor: { id: string };
  book?: { id: string | null } | null;
  createdAt: string | number | Date;
}

/** One feed entry: `items` newest first; `items[0]` is the one to show for single-book kinds. */
export interface ActivityGroup<T> {
  id: string;
  items: T[];
}

/** What makes two activities "the same thing again", or null when they never group. */
function groupKey(item: GroupableActivity): string | null {
  switch (item.kind) {
    case "shelved":
      return `${item.actor.id}:shelved:${String(item.data?.status)}`;
    case "finished":
      return `${item.actor.id}:finished`;
    // Logging pages on the same book several times reads as one update (the latest page).
    case "progress":
      return item.book?.id ? `${item.actor.id}:progress:${item.book.id}` : null;
    default:
      return null;
  }
}

/**
 * Collapses runs of repeated activities (newest first in, newest first out): eight books added
 * to "Quero ler" in one evening become one entry, and progress on a book keeps only the latest
 * page. Posts and follows always stand alone.
 */
export function groupActivities<T extends GroupableActivity>(items: T[]): ActivityGroup<T>[] {
  const groups: ActivityGroup<T>[] = [];
  let currentKey: string | null = null;
  for (const item of items) {
    const key = groupKey(item);
    const group = groups.at(-1);
    const first = group?.items[0];
    if (
      group &&
      first &&
      key !== null &&
      key === currentKey &&
      new Date(first.createdAt).getTime() - new Date(item.createdAt).getTime() <= GROUP_WINDOW_MS
    ) {
      group.items.push(item);
    } else {
      groups.push({ id: item.id, items: [item] });
      currentKey = key;
    }
  }
  return groups;
}

/** Sentence for a group of `count` activities (see `groupActivities`). */
export function describeActivityGroup(
  kind: ActivityKind,
  data: Record<string, unknown> | null,
  count: number,
): string {
  if (count > 1 && kind === "shelved") {
    const status = data?.status as ShelfStatus | undefined;
    return status
      ? `adicionou ${count} livros à estante “${SHELF_LABELS[status]}”`
      : `adicionou ${count} livros`;
  }
  if (count > 1 && kind === "finished") return `terminou de ler ${count} livros`;
  return describeActivity(kind, data);
}

/**
 * Headline of a feed card. Progress reads "está lendo": the card shows the page under the book
 * (see `activityProgress`), so the sentence doesn't repeat it.
 */
export function feedHeadline(
  kind: ActivityKind,
  data: Record<string, unknown> | null,
  count: number,
): string {
  return kind === "progress" ? "está lendo" : describeActivityGroup(kind, data, count);
}

/** The progress bar of a feed card: 40% and "p. 120 de 300", or just the page without a total. */
export function activityProgress(
  data: Record<string, unknown> | null,
  pages: number | null,
): { percent: number | null; label: string } | null {
  const page = typeof data?.page === "number" ? data.page : null;
  if (page === null) return null;
  if (!pages || pages <= 0) return { percent: null, label: `p. ${page}` };
  const percent = Math.min(100, Math.max(0, Math.round((page / pages) * 100)));
  return { percent, label: `p. ${page} de ${pages}` };
}
