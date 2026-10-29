import { GENRE_LABELS, type Genre } from "../books/genres";
import { percentChange, shiftMonth, toMonthKey } from "../lib/date";

/** Layouts for the shareable monthly card (rendered by each client). */
export const CARD_TEMPLATES = ["fita", "estante", "diario", "recibo"] as const;
export type CardTemplate = (typeof CARD_TEMPLATES)[number];

export const CARD_TEMPLATE_LABELS: Record<CardTemplate, { label: string; description: string }> = {
  fita: { label: "Fita", description: "Ousado, com faixa e números grandes" },
  estante: { label: "Estante", description: "Os livros do mês lado a lado" },
  diario: { label: "Diário", description: "Delicado, com brilhos e capa" },
  recibo: { label: "Recibo", description: "Seu mês em forma de nota fiscal" },
};

/** What a card summarizes: one month (`YYYY-MM`) or a whole year (the "retrospectiva"). */
export type CardPeriod = { kind: "month"; month: string } | { kind: "year"; year: number };

export interface CardBook {
  title: string;
  authors: string[];
  coverUrl: string | null;
  rating: number | null;
}

/** Everything a card template needs, already formatted for display. */
export interface CardData {
  kind: CardPeriod["kind"];
  /** "outubro de 2026" · "2026" */
  periodLabel: string;
  /** The big title: "outubro" · "2026" */
  periodName: string;
  /** "set." · "2025" — what the deltas compare against. */
  previousShort: string;
  /** "mês" · "ano", for copy like "Gênero do mês". */
  unit: string;
  year: number;
  booksRead: number;
  pagesRead: number;
  genre: string | null;
  goal: { percent: number; done: number; target: number } | null;
  favorite: CardBook | null;
  books: CardBook[];
  /** Percent change vs the previous period; null without a baseline. */
  deltas: { books: number | null; pages: number | null };
  name: string;
  username: string | null;
}

interface CardSummary {
  booksRead: number;
  pagesRead: number;
  topGenre: string | null;
  favoriteBook: CardBook | null;
  books: CardBook[];
  goal: CardData["goal"];
}

const longMonth = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const monthOnly = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" });
const shortMonth = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });
const monthDate = (key: string) => new Date(`${key}-15T12:00:00Z`);

/** The period right before `period` (deltas compare against it). */
export function previousPeriod(period: CardPeriod): CardPeriod {
  return period.kind === "month"
    ? { kind: "month", month: shiftMonth(period.month, -1) }
    : { kind: "year", year: period.year - 1 };
}

/** Shapes a summary (and the one before it, for deltas) for the card templates. */
export function buildCardData(
  period: CardPeriod,
  current: CardSummary,
  previous: Pick<CardSummary, "booksRead" | "pagesRead"> | null,
  reader: { name: string; username: string | null },
): CardData {
  const labels =
    period.kind === "month"
      ? {
          periodLabel: longMonth.format(monthDate(period.month)),
          periodName: monthOnly.format(monthDate(period.month)),
          previousShort: shortMonth.format(monthDate(shiftMonth(period.month, -1))),
          unit: "mês",
          year: Number(period.month.slice(0, 4)),
        }
      : {
          periodLabel: String(period.year),
          periodName: String(period.year),
          previousShort: String(period.year - 1),
          unit: "ano",
          year: period.year,
        };
  return {
    kind: period.kind,
    ...labels,
    booksRead: current.booksRead,
    pagesRead: current.pagesRead,
    genre: current.topGenre ? (GENRE_LABELS[current.topGenre as Genre] ?? current.topGenre) : null,
    goal: current.goal,
    favorite: current.favoriteBook,
    books: current.books,
    deltas: {
      books: previous ? percentChange(current.booksRead, previous.booksRead) : null,
      pages: previous ? percentChange(current.pagesRead, previous.pagesRead) : null,
    },
    name: reader.name,
    username: reader.username,
  };
}

/**
 * Which year's retrospectiva to offer on `date`: the current year in December, the year that
 * just ended in January, nothing the rest of the year (the studio still has it).
 */
export function retrospectiveYear(date: Date, timeZone?: string): number | null {
  const [year, month] = toMonthKey(date, timeZone).split("-").map(Number) as [number, number];
  if (month === 12) return year;
  if (month === 1) return year - 1;
  return null;
}

/** "★★★★☆" for a 0–5 rating (none counts as zero). */
export function ratingStars(rating: number | null): string {
  const value = rating ?? 0;
  return "★".repeat(value) + "☆".repeat(5 - value);
}

/** True for dark backgrounds (relative luminance of a `#RRGGBB` color). */
export function isDarkColor(hex: string): boolean {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.5;
}
