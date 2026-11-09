import { z } from "zod";

/**
 * How a book made the reader feel, while reading it (marking a page) and once it's over (the
 * rating). A fixed list, so the book page can add everyone's answers up ("62% sentiram
 * tensão"). Nouns, so the labels have no grammatical gender.
 */
export const FEELINGS = [
  "alegria",
  "diversao",
  "conforto",
  "esperanca",
  "inspiracao",
  "reflexao",
  "nostalgia",
  "paixao",
  "curiosidade",
  "surpresa",
  "tensao",
  "medo",
  "angustia",
  "tristeza",
  "raiva",
  "tedio",
] as const;
export type Feeling = (typeof FEELINGS)[number];

export const FEELING_LABELS: Record<Feeling, string> = {
  alegria: "Alegria",
  diversao: "Diversão",
  conforto: "Conforto",
  esperanca: "Esperança",
  inspiracao: "Inspiração",
  reflexao: "Reflexão",
  nostalgia: "Nostalgia",
  paixao: "Paixão",
  curiosidade: "Curiosidade",
  surpresa: "Surpresa",
  tensao: "Tensão",
  medo: "Medo",
  angustia: "Angústia",
  tristeza: "Tristeza",
  raiva: "Raiva",
  tedio: "Tédio",
};

/** Feelings picked at once: the strongest few say more than a long list. */
export const MAX_FEELINGS = 7;
/** How many feelings the reading diary suggests when a book is over. */
export const SUGGESTED_FEELINGS = 3;

const isFeeling = (value: string): value is Feeling =>
  (FEELINGS as readonly string[]).includes(value);

/** Up to `MAX_FEELINGS` distinct feelings, in the order picked. */
export const feelingsSchema = z
  .array(z.enum(FEELINGS, { error: "Sentimento inválido" }))
  .transform((feelings) => [...new Set(feelings)])
  .pipe(z.array(z.enum(FEELINGS)).max(MAX_FEELINGS, `Escolha até ${MAX_FEELINGS} sentimentos`));

/** Picks or drops `feeling`; a new one past the limit is ignored. */
export function toggleFeeling(feelings: readonly Feeling[], feeling: Feeling): Feeling[] {
  if (feelings.includes(feeling)) return feelings.filter((value) => value !== feeling);
  return feelings.length >= MAX_FEELINGS ? [...feelings] : [...feelings, feeling];
}

/**
 * What to suggest when the book is over: the feelings marked most often along the way (in
 * reading order, oldest first), ties going to the latest one marked.
 */
export function suggestFeelings(marks: readonly (readonly string[])[]): Feeling[] {
  const score = new Map<Feeling, { count: number; last: number }>();
  marks.forEach((feelings, index) => {
    for (const feeling of feelings) {
      if (!isFeeling(feeling)) continue;
      score.set(feeling, { count: (score.get(feeling)?.count ?? 0) + 1, last: index });
    }
  });
  return [...score.entries()]
    .sort(([, a], [, b]) => b.count - a.count || b.last - a.last)
    .slice(0, SUGGESTED_FEELINGS)
    .map(([feeling]) => feeling);
}

/**
 * The book's most felt feelings, as a share of the readers who said how they felt.
 * Unknown keys (a feeling taken off the list) are left out.
 */
export function topFeelings(counts: Record<string, number>, readers: number, limit = 5) {
  if (readers <= 0) return [];
  return Object.entries(counts)
    .filter((entry): entry is [Feeling, number] => isFeeling(entry[0]) && entry[1] > 0)
    .sort(
      ([a, countA], [b, countB]) => countB - countA || FEELINGS.indexOf(a) - FEELINGS.indexOf(b),
    )
    .slice(0, limit)
    .map(([feeling, count]) => ({
      feeling,
      label: FEELING_LABELS[feeling],
      count,
      percent: Math.round((count / readers) * 100),
    }));
}

/**
 * The feelings a feed card shows: the page's (`data.feelings` of a progress update), else the
 * rating's (a finished book). Anything not on the list is dropped.
 */
export function cardFeelings(
  data: Record<string, unknown> | null,
  ratingFeelings: readonly string[] = [],
): Feeling[] {
  const marked = Array.isArray(data?.feelings) ? (data.feelings as unknown[]) : ratingFeelings;
  return marked.filter((value): value is Feeling => typeof value === "string" && isFeeling(value));
}

/** Stars go in halves: ½ to 5. */
export const RATING_STEP = 0.5;

export const ratingSchema = z
  .number({ error: "Nota inválida" })
  .min(RATING_STEP, "Nota inválida")
  .max(5, "Nota inválida")
  .multipleOf(RATING_STEP, "Nota inválida");

/** "4", "4,5". */
export const formatRating = (rating: number) =>
  rating.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

export type StarFill = "full" | "half" | "empty";

/** How each of the 5 stars is drawn for `rating` (null: none filled). */
export function starFills(rating: number | null): StarFill[] {
  const value = rating ?? 0;
  return [1, 2, 3, 4, 5].map((star) =>
    value >= star ? "full" : value >= star - RATING_STEP ? "half" : "empty",
  );
}

/**
 * The rating a tap gives: the left half of a star is its ½, the right half the whole star.
 * Tapping the current rating again clears it.
 */
export const nextRating = (current: number | null, tapped: number): number | null =>
  current === tapped ? null : tapped;

/** Star bar of the book page a rating counts in: 4½ counts as 4 stars, ½ as 1. */
export const starBucket = (rating: number) => Math.min(5, Math.max(1, Math.floor(rating))) - 1;

/** "5 ★ 42%": the share of ratings in each star bar, 5 stars first. */
export function starShares(stars: readonly number[]) {
  const total = stars.reduce((sum, count) => sum + count, 0);
  return [5, 4, 3, 2, 1].map((star) => {
    const count = stars[star - 1] ?? 0;
    return { star, count, percent: total ? Math.round((count / total) * 100) : 0 };
  });
}
