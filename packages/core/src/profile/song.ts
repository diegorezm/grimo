/**
 * "Trilha da leitura": reading what a music link's page says about the song (name, artist,
 * cover) and the card color taken from the cover. Pure, so the backend fetches and these parse.
 */

export interface SongMeta {
  title: string | null;
  artist: string | null;
  /** The cover image the page points to (downloaded by the backend, never by the apps). */
  image: string | null;
}

const decodeEntities = (text: string) =>
  text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

/** `<meta property|name="key" content="…">`, in either attribute order. */
function metaContent(html: string, key: string): string | null {
  const name = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${name}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const value = pattern.exec(html)?.[1];
    if (value) return decodeEntities(value);
  }
  return null;
}

/**
 * Song name, artist and cover from a music page's Open Graph tags. Spotify says the artist in
 * `music:musician_description` (and first in "Artista · Álbum · Song · 2012"); Apple Music in
 * the title ("Música – Artista" or "Música by Artista").
 */
export function parseSongPage(html: string): SongMeta {
  let title = metaContent(html, "og:title");
  let artist =
    metaContent(html, "music:musician_description") ??
    metaContent(html, "og:description")?.split(" · ")[0]?.trim() ??
    null;
  if (title && !metaContent(html, "music:musician_description")) {
    const split = /^(.+?)\s+(?:by|de|–|-)\s+(.+?)(?:\s+(?:on|no)\s+Apple Music)?$/i.exec(title);
    if (split) {
      title = split[1]!.trim();
      artist = split[2]!.trim();
    }
  }
  return { title, artist, image: metaContent(html, "og:image") };
}

/** Average color of RGBA pixels (every `step`th pixel is enough for a cover). */
export function averageColor(rgba: Uint8Array, step = 16) {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i + 3 < rgba.length; i += 4 * step) {
    r += rgba[i]!;
    g += rgba[i + 1]!;
    b += rgba[i + 2]!;
    n++;
  }
  return n === 0 ? null : { r: r / n, g: g / n, b: b / n };
}

/**
 * The song card's background from the cover's average color: same hue, dark enough for light
 * text (lightness 22%, saturation capped), so any cover gives a readable card.
 */
export function songCardColor({ r, g, b }: { r: number; g: number; b: number }): string {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let hue = 0;
  if (delta > 0) {
    if (max === rn) hue = ((gn - bn) / delta) % 6;
    else if (max === gn) hue = (bn - rn) / delta + 2;
    else hue = (rn - gn) / delta + 4;
  }
  hue = (hue * 60 + 360) % 360;
  const lightness = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  return hslToHex(hue, Math.min(saturation, 0.45), 0.22);
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  const hex = (value: number) =>
    Math.round((value + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}
