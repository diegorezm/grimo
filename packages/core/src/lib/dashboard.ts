import { SHELF_STATUSES, type ShelfStatus } from "../shelves";

/** Time-of-day greeting shown on the dashboard ("Bom dia", "Boa tarde", "Boa noite"). */
export function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

/** Reading progress as 0–100, or null when the page count is unknown. */
export function readingPercent(currentPage: number, pageCount: number | null): number | null {
  if (!pageCount || pageCount <= 0) return null;
  return Math.min(100, Math.max(0, Math.round((currentPage / pageCount) * 100)));
}

/** Number of books on each shelf, plus the total. */
export function countByShelf(
  entries: { status: ShelfStatus }[],
): Record<ShelfStatus, number> & { all: number } {
  const counts = Object.fromEntries(SHELF_STATUSES.map((s) => [s, 0])) as Record<
    ShelfStatus,
    number
  >;
  for (const { status } of entries) counts[status] += 1;
  return { ...counts, all: entries.length };
}

/** Short relative time in pt-BR: "agora", "há 5 min", "há 3 h", "há 2 d". */
export function timeAgo(date: Date, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  return `há ${Math.floor(hours / 24)} d`;
}

/** Books finished in each month of `year` (index 0 = January), by local time. */
export function finishedPerMonth(
  entries: { status: ShelfStatus; finishedAt: Date | string | null }[],
  year: number,
): number[] {
  const months = Array.from({ length: 12 }, () => 0);
  for (const { status, finishedAt } of entries) {
    if (status !== "read" || !finishedAt) continue;
    const date = new Date(finishedAt);
    if (date.getFullYear() === year) months[date.getMonth()]! += 1;
  }
  return months;
}

/** Most read genres across `books`, most frequent first. */
export function genreBreakdown(
  books: { genres: string[] }[],
  limit = 5,
): { genre: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const { genres } of books) {
    for (const genre of genres) counts.set(genre, (counts.get(genre) ?? 0) + 1);
  }
  return [...counts]
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
