import { useMe, useMonthlySummary } from "@grimo/client";
import { GENRE_LABELS, type Genre, percentChange, shiftMonth } from "@grimo/core";
import type { CardData } from "./types";

const long = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
const name = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" });
const short = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });

const monthDate = (key: string) => new Date(`${key}-15T12:00:00Z`);

/** Summary of `month` plus the previous month (for deltas), shaped for the card templates. */
export function useCardData(month: string): CardData | null {
  const previous = shiftMonth(month, -1);
  const current = useMonthlySummary(month).data;
  const before = useMonthlySummary(previous).data;
  const me = useMe().data;
  if (!current || !me) return null;

  return {
    monthLabel: long.format(monthDate(month)),
    monthName: name.format(monthDate(month)),
    previousShort: short.format(monthDate(previous)),
    year: monthDate(month).getUTCFullYear(),
    booksRead: current.booksRead,
    pagesRead: current.pagesRead,
    genre: current.topGenre ? (GENRE_LABELS[current.topGenre as Genre] ?? current.topGenre) : null,
    goal: current.goal,
    favorite: current.favoriteBook,
    books: current.books,
    deltas: {
      books: before ? percentChange(current.booksRead, before.booksRead) : null,
      pages: before ? percentChange(current.pagesRead, before.pagesRead) : null,
    },
    name: me.name,
    username: me.username,
  };
}
