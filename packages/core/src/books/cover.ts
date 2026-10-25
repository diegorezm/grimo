/**
 * Open Library cover sizes: S ≈ 40px wide, M ≈ 180px, L ≈ 500px. Pick the smallest that still
 * looks sharp on high-density screens (M for thumbnails, L for large covers).
 */
export type CoverSize = "S" | "M" | "L";

const OPEN_LIBRARY_COVER = /^(https:\/\/covers\.openlibrary\.org\/b\/[a-z]+\/[^/-]+)-[SML]\.jpg$/i;

/** Whether `url` is an Open Library cover (the only covers books may have). */
export const isOpenLibraryCover = (url: string) => OPEN_LIBRARY_COVER.test(url);

/** Same cover at another size. URLs that are not Open Library covers are returned unchanged. */
export function coverUrl(url: string, size: CoverSize): string;
export function coverUrl(url: string | null, size: CoverSize): string | null;
export function coverUrl(url: string | null, size: CoverSize) {
  if (!url) return url;
  const match = OPEN_LIBRARY_COVER.exec(url);
  return match ? `${match[1]}-${size}.jpg` : url;
}
