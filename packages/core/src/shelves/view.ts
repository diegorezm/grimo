export const SHELF_VIEWS = ["grid", "spines"] as const;
export type ShelfView = (typeof SHELF_VIEWS)[number];

export const SHELF_VIEW_LABELS: Record<ShelfView, string> = {
  grid: "Capas",
  spines: "Lombadas",
};

export const SHELF_VIEW_HINTS: Record<ShelfView, string> = {
  grid: "Os livros em pé, em grade, com progresso e nota.",
  spines: "Uma prateleira de lombadas; passe o mouse para ver a capa inteira.",
};

export function isShelfView(value: unknown): value is ShelfView {
  return SHELF_VIEWS.includes(value as ShelfView);
}

/**
 * Books read, newest first, in runs by the year they were finished ("Lidos '26", "Lidos '25"):
 * the profile's shelf of covers. Books without a date go to the end, in their own run.
 */
export function groupByYearRead<T extends { finishedAt: number | null }>(
  items: readonly T[],
  yearOfDate: (date: Date) => number,
): { year: number | null; items: T[] }[] {
  const sorted = [...items].sort((a, b) => (b.finishedAt ?? -1) - (a.finishedAt ?? -1));
  const groups: { year: number | null; items: T[] }[] = [];
  for (const item of sorted) {
    const year = item.finishedAt === null ? null : yearOfDate(new Date(item.finishedAt));
    const last = groups[groups.length - 1];
    if (last && last.year === year) last.items.push(item);
    else groups.push({ year, items: [item] });
  }
  return groups;
}

/** "Lidos '26": the short year label of a run. */
export const yearRunLabel = (year: number | null) =>
  year === null ? "Sem data" : `Lidos '${String(year).slice(-2)}`;

/** A count that fits a profile stat: 950, "9,4 mil", "12 mil", "1,2 mi". */
export function compactCount(value: number): string {
  const short = (n: number, unit: string) =>
    `${(Math.floor(n * 10) / 10).toLocaleString("pt-BR", { maximumFractionDigits: n < 10 ? 1 : 0 })} ${unit}`;
  if (value >= 1_000_000) return short(value / 1_000_000, "mi");
  if (value >= 1_000) return short(value / 1_000, "mil");
  return String(value);
}
