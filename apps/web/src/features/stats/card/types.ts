import type { CardPalette } from "@grimo/tokens";

export interface CardBook {
  title: string;
  authors: string[];
  coverUrl: string | null;
  rating: number | null;
}

/** Everything a card template needs, already formatted for display. */
export interface CardData {
  /** "outubro de 2026" */
  monthLabel: string;
  /** "outubro" */
  monthName: string;
  /** "set." — the month the deltas compare against. */
  previousShort: string;
  year: number;
  booksRead: number;
  pagesRead: number;
  genre: string | null;
  goal: { percent: number; done: number; target: number } | null;
  favorite: CardBook | null;
  books: CardBook[];
  /** Percent change vs the previous month; null without a baseline. */
  deltas: { books: number | null; pages: number | null };
  name: string;
  username: string | null;
}

export interface CardProps {
  data: CardData;
  palette: CardPalette;
  showCover: boolean;
  showDeltas: boolean;
}
