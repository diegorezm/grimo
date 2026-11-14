export const SPINE_VARIANTS = 4;

export interface SpineLook {
  /** Which of the token-based spine palettes to use (0..SPINE_VARIANTS-1). */
  variant: number;
  /** Spine width in px: thicker books are wider. */
  width: number;
  /** Spine height in px: varies a little so the row feels like real books. */
  height: number;
}

/** djb2 of a title: the same book always gets the same spine, on web and mobile. */
export function titleHash(text: string): number {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic spine look for a book: same book, same spine, on web and mobile. */
export function spineLook(title: string, pageCount: number | null | undefined): SpineLook {
  const h = titleHash(title);
  const pages = Math.min(Math.max(pageCount ?? 250, 80), 900);
  return {
    variant: h % SPINE_VARIANTS,
    width: Math.round(52 + ((pages - 80) / 820) * 40),
    height: 300 + ((h >> 3) % 5) * 16,
  };
}
