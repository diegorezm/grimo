import type { CardBook } from "./card";

const DAY = 24 * 60 * 60 * 1000;

/** The Stories card of one book: "Terminei de ler" or a quote. */
export interface BookStoryData {
  kind: "finished" | "quote";
  /** "GRIMO · LIDO" / "GRIMO · CITAÇÃO". */
  eyebrow: string;
  book: CardBook;
  /** "Terminei de ler" (finished only). */
  headline: string | null;
  /** "320 páginas · em 12 dias" (finished only). */
  summary: string | null;
  quote: { body: string; page: number | null } | null;
  username: string | null;
}

/**
 * "Terminei de ler": the book, the rating and how long it took. `pages` is the reader's
 * edition (see `editionPages`).
 */
export function buildFinishedCard(
  book: Pick<CardBook, "title" | "authors" | "coverUrl">,
  entry: { rating: number | null; startedAt: number | null; finishedAt: number | null },
  pages: number | null,
  username: string | null,
): BookStoryData {
  const parts: string[] = [];
  if (pages) parts.push(`${pages} páginas`);
  if (entry.startedAt !== null && entry.finishedAt !== null) {
    const days = Math.max(1, Math.ceil((entry.finishedAt - entry.startedAt) / DAY));
    parts.push(`em ${days} ${days === 1 ? "dia" : "dias"}`);
  }
  return {
    kind: "finished",
    eyebrow: "GRIMO · LIDO",
    book: { ...book, rating: entry.rating },
    headline: "Terminei de ler",
    summary: parts.length > 0 ? parts.join(" · ") : null,
    quote: null,
    username,
  };
}

/** A quote with its page, and the book it is from. */
export function buildQuoteCard(
  book: Pick<CardBook, "title" | "authors" | "coverUrl">,
  quote: { body: string; page: number | null },
  username: string | null,
): BookStoryData {
  return {
    kind: "quote",
    eyebrow: "GRIMO · CITAÇÃO",
    book: { ...book, rating: null },
    headline: null,
    summary: null,
    quote,
    username,
  };
}

/** Font size (card pixels) that fits a quote of this length on the 1080×1920 card. */
export function quoteFontSize(body: string): number {
  if (body.length <= 90) return 92;
  if (body.length <= 200) return 72;
  if (body.length <= 400) return 56;
  return 44;
}
