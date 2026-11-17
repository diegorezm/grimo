import { GENRE_LABELS, type Genre } from "../books/genres";
import { FEELING_LABELS, type Feeling } from "../ratings";
import type { CardBook } from "./card";

const DAY = 24 * 60 * 60 * 1000;

/** Layouts for the shareable "Terminei de ler" card (rendered by web & mobile). */
export const FINISHED_CARD_TEMPLATES = ["cantinho", "diario", "fita", "ficha", "cartaz"] as const;
export type FinishedCardTemplate = (typeof FINISHED_CARD_TEMPLATES)[number];

export const FINISHED_CARD_TEMPLATE_LABELS: Record<
  FinishedCardTemplate,
  { label: string; description: string }
> = {
  cantinho: { label: "Cantinho", description: "Cena aconchegante com leitor e caneca" },
  diario: { label: "Diário", description: "Resenha, sensações e ritmo" },
  fita: { label: "Fita", description: "Faixa ousada e números de leitura" },
  ficha: { label: "Ficha", description: "Cartão de biblioteca com trilha" },
  cartaz: { label: "Cartaz", description: "Capa em destaque e pílulas limpas" },
};

export interface FinishedDiaryHighlight {
  page: number;
  feelings: string[];
}

export interface FinishedBookDetails {
  pages: number | null;
  days: number | null;
  pagesPerDay: number | null;
  /** "10 out – 22 out" (when startedAt & finishedAt exist). */
  periodRange: string | null;
  /** "OUT 2026" (for headers and stamps). */
  finishedMonth: string | null;
  /** "OUT/26" (for the Ficha library stamp). */
  finishedStamp: string | null;
  genre: string | null;
  publishedYear: number | null;
  /** Up to 3 feeling labels in pt-BR ("Envolvente", "Tensão"...). */
  feelings: string[];
  reviewExcerpt: string | null;
  /** Up to 3 evenly-spaced diary feeling highlights along the pages. */
  diaryMarks: FinishedDiaryHighlight[];
  yearRank: { index: number; year: number; target: number | null } | null;
  rereadCount: number;
}

/** Extra reading/diary metadata used by the richer finished-book templates. */
export interface BuildFinishedCardExtra {
  genres?: readonly string[];
  publishedYear?: number | null;
  feelings?: readonly string[];
  pastReads?: number;
  reviewBody?: string | null;
  diaryMarks?: readonly { page: number; feelings: readonly string[] }[];
  yearRank?: { index: number; year: number; target: number | null } | null;
}

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
  details: FinishedBookDetails | null;
  quote: { body: string; page: number | null } | null;
  username: string | null;
}

const shortDayMonth = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const shortMonthYear = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function labelFeeling(value: string): string {
  return (FEELING_LABELS as Record<string, string>)[value] ?? value;
}

function labelGenre(genres: readonly string[] | undefined): string | null {
  if (!genres?.length) return null;
  const first = genres[0]!;
  return (GENRE_LABELS as Record<string, string>)[first as Genre] ?? first;
}

function formatDayMonth(ms: number): string {
  return shortDayMonth.format(new Date(ms)).replaceAll(".", "").replace(" de ", " ");
}

function formatMonthStamp(ms: number): { finishedMonth: string; finishedStamp: string } {
  const date = new Date(ms);
  const raw = shortMonthYear.format(date).replaceAll(".", "").replace(" de ", " ").toUpperCase();
  const mon = raw.split(" ")[0] ?? "";
  const yy = String(date.getUTCFullYear()).slice(-2);
  return { finishedMonth: raw, finishedStamp: `${mon}/${yy}` };
}

function clipExcerpt(body: string | null | undefined, max = 140): string | null {
  const clean = body?.replace(/\s+/g, " ").trim();
  if (!clean) return null;
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function pickDiaryHighlights(
  marks: readonly { page: number; feelings: readonly string[] }[] | undefined,
): FinishedDiaryHighlight[] {
  const nonEmpty = (marks ?? [])
    .map((mark) => ({
      page: mark.page,
      feelings: mark.feelings.slice(0, 2).map(labelFeeling),
    }))
    .filter((mark) => mark.feelings.length > 0);
  if (nonEmpty.length <= 3) return nonEmpty;
  const mid = Math.floor((nonEmpty.length - 1) / 2);
  return [nonEmpty[0]!, nonEmpty[mid]!, nonEmpty[nonEmpty.length - 1]!];
}

/** Format a 0.5-step rating in pt-BR ("4,5", "5,0"). */
export function formatCardRating(rating: number): string {
  return rating.toFixed(1).replace(".", ",");
}

/**
 * "Terminei de ler": the book, the rating, pacing and diary highlights. `pages` is the reader's
 * edition (see `editionPages`).
 */
export function buildFinishedCard(
  book: Pick<CardBook, "title" | "authors" | "coverUrl">,
  entry: { rating: number | null; startedAt: number | null; finishedAt: number | null },
  pages: number | null,
  username: string | null,
  extra?: BuildFinishedCardExtra,
): BookStoryData {
  const parts: string[] = [];
  if (pages) parts.push(`${pages} páginas`);
  const days =
    entry.startedAt !== null && entry.finishedAt !== null
      ? Math.max(1, Math.ceil((entry.finishedAt - entry.startedAt) / DAY))
      : null;
  if (days !== null) {
    parts.push(`em ${days} ${days === 1 ? "dia" : "dias"}`);
  }
  const pagesPerDay = pages && days ? Math.max(1, Math.round(pages / days)) : null;
  const periodRange =
    entry.startedAt !== null && entry.finishedAt !== null
      ? `${formatDayMonth(entry.startedAt)} – ${formatDayMonth(entry.finishedAt)}`
      : null;
  const stamp = entry.finishedAt !== null ? formatMonthStamp(entry.finishedAt) : null;

  return {
    kind: "finished",
    eyebrow: "GRIMO · LIDO",
    book: { ...book, rating: entry.rating },
    headline: "Terminei de ler",
    summary: parts.length > 0 ? parts.join(" · ") : null,
    details: {
      pages,
      days,
      pagesPerDay,
      periodRange,
      finishedMonth: stamp?.finishedMonth ?? null,
      finishedStamp: stamp?.finishedStamp ?? null,
      genre: labelGenre(extra?.genres),
      publishedYear: extra?.publishedYear ?? null,
      feelings: (extra?.feelings ?? []).slice(0, 3).map((f) => labelFeeling(f as Feeling)),
      reviewExcerpt: clipExcerpt(extra?.reviewBody),
      diaryMarks: pickDiaryHighlights(extra?.diaryMarks),
      yearRank: extra?.yearRank ?? null,
      rereadCount: extra?.pastReads ?? 0,
    },
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
    details: null,
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
