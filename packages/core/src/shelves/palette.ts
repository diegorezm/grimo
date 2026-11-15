/**
 * A spine in the colors of its cover: the cover's main color, a second one for the band across
 * the spine, and an ink that reads on the first. The backend computes it once per book from the
 * cover's pixels (`books.paintSpines`); the apps only paint.
 */

export interface SpineColors {
  /** The spine itself: the cover's most common color. */
  base: string;
  /** The band at the head of the spine: the cover's second color. */
  band: string;
  /** Title on `base`. */
  ink: string;
}

type Rgb = readonly [number, number, number];

const INK_DARK: Rgb = [46, 36, 51];
const INK_LIGHT: Rgb = [255, 247, 236];

const hex = ([r, g, b]: Rgb) =>
  `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;

export function rgbOf(color: string): Rgb {
  const n = Number.parseInt(color.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** WCAG relative luminance, 0..1. */
function luminance([r, g, b]: Rgb) {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: Rgb, b: Rgb) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const distance = (a: Rgb, b: Rgb) =>
  Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/** Hue of a color, 0..360 (grays: 0), for the rainbow order. */
export function hueOf(color: string) {
  const [r, g, b] = rgbOf(color).map((c) => c / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d < 0.08) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return Math.round((h * 60 + 360) % 360);
}

/** Colors closer than this are the same color (the band has to look different from the spine). */
const DISTINCT = 70;
/** The band's color has to cover at least this share of the cover. */
const MIN_SHARE = 0.03;

/**
 * The spine's colors from a cover's RGBA pixels (every `step`th pixel is enough). Null when
 * there are no pixels to look at.
 */
export function spinePalette(rgba: Uint8Array, step = 8): SpineColors | null {
  // 4 bits per channel: 4096 buckets, each with how many pixels and their summed color.
  const buckets = new Map<number, [count: number, r: number, g: number, b: number]>();
  let total = 0;
  for (let i = 0; i + 3 < rgba.length; i += 4 * step) {
    if (rgba[i + 3]! < 128) continue;
    const r = rgba[i]!;
    const g = rgba[i + 1]!;
    const b = rgba[i + 2]!;
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket[0]++;
      bucket[1] += r;
      bucket[2] += g;
      bucket[3] += b;
    } else {
      buckets.set(key, [1, r, g, b]);
    }
    total++;
  }
  if (total === 0) return null;

  const colors = [...buckets.values()]
    .map(([count, r, g, b]) => ({ count, rgb: [r / count, g / count, b / count] as Rgb }))
    .sort((a, b) => b.count - a.count);
  const base = colors[0]!.rgb;
  const second = colors.find(
    (color) => color.count / total >= MIN_SHARE && distance(color.rgb, base) >= DISTINCT,
  );
  // A cover of one color: the band is the same color, a little lighter or darker.
  const band = second?.rgb ?? mix(base, luminance(base) > 0.4 ? INK_DARK : INK_LIGHT, 0.3);
  const ink = contrast(base, INK_DARK) >= contrast(base, INK_LIGHT) ? INK_DARK : INK_LIGHT;
  return { base: hex(base), band: hex(band), ink: hex(ink) };
}

export type SpineLettering = "serif" | "mono" | "caps";
