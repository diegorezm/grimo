import type { CardData, ShelfStyle } from "@grimo/core";

/**
 * The contract between the apps (public) and the paid content (private). The apps know the
 * **keys** of every paid choice (`SHELF_PREMIUM`, `CARD_PREMIUM_TEMPLATES` in `@grimo/core`);
 * what each one looks like comes from `@grimo/premium/tokens|web|mobile`, which is empty when
 * the private content is not checked out (see the package README).
 */

/** A shelf material: same shape as `shelfMaterials` in `@grimo/tokens`. */
export interface MaterialTokens {
  room: string;
  side: string;
  back: string;
  plankTop: string;
  plank: string;
  grain: string | null;
  ink: string;
  dark: boolean;
  /** `SPINE_TONES` spine colors, in rainbow order. */
  tones: readonly string[];
  /** A metal line along the front of each plank (paid materials). */
  trim?: string;
}

/** A share card palette: same shape as `cardPalettes` in `@grimo/tokens`. */
export interface CardPaletteTokens {
  label: string;
  bg: string;
  paper: string;
  ink: string;
  muted: string;
  accent: string;
  accent2: string;
}

interface Paint {
  fill?: string;
  stroke?: string;
  /** Stroke width. */
  sw?: number;
  opacity?: number;
  round?: boolean;
}

/** One vector shape. Plain data, so web (`<svg>`) and mobile (`react-native-svg`) draw the same. */
export type ArtShape =
  | ({ t: "path"; d: string } & Paint)
  | ({ t: "circle"; cx: number; cy: number; r: number } & Paint)
  | ({ t: "ellipse"; cx: number; cy: number; rx: number; ry: number } & Paint)
  | ({ t: "rect"; x: number; y: number; w: number; h: number; rx?: number } & Paint);

/** A drawing in its own box (`width` × `height` points). */
export interface Art {
  width: number;
  height: number;
  shapes: readonly ArtShape[];
}

/** Content that is the same on every platform. */
export interface PremiumTokens {
  shelfMaterials: Record<string, MaterialTokens>;
  cardPalettes: Record<string, CardPaletteTokens>;
  /** Objects on the planks, by `ShelfDecor` key. */
  decor: Record<string, Art>;
  /** The ornament over each paid model (stretched to the bookcase's width), by `ShelfModel`. */
  crowns: Record<string, Art>;
}

/** The furniture's styles (`S` is the platform's style object, `R` the under-plank light). */
export interface ShelfLook<S, R> {
  frame: S;
  crown: S;
  inner: S;
  cell: S;
  row: S;
  plankTop: S;
  plank: S;
  light: S | null;
  rowLight: R | null;
}

export interface ShelfModelArgs<S, R> {
  style: ShelfStyle;
  width: number;
  /** Room above the first shelf (mobile: under the floating header). */
  top: number;
  material: MaterialTokens;
  /** The classic model's look in this material, to start from. */
  look: ShelfLook<S, R>;
}

export interface ShelfModelArt<S, R> {
  look: (args: ShelfModelArgs<S, R>) => ShelfLook<S, R>;
  /** Over everything, not touchable (glass, reflections). */
  over?: (args: ShelfModelArgs<S, R>) => S;
  /** The furniture's outline in the small drawings. */
  thumb: (material: MaterialTokens) => S;
}

/** How a spine finish is painted (`B` is the platform's binding: what goes over the color). */
export interface SpineFinishArt<B> {
  binding: B;
  /** How much darker than the tone the spine is (0..1). */
  deepen: number;
  /** The title's color on a light or a dark spine. */
  ink: (light: boolean) => string;
}

export interface CardArtProps {
  data: CardData;
  palette: CardPaletteTokens;
  showCover: boolean;
  showDeltas: boolean;
}

/**
 * Content drawn by one platform. `S`: style object; `R`: under-plank light; `F`: how a spine
 * finish is painted; `C`: a card component.
 */
export interface PremiumPlatform<S, R, F, C> {
  models: Record<string, ShelfModelArt<S, R>>;
  /** The back panel's pattern, by material. */
  backPatterns: Record<string, S>;
  finishes: Record<string, F>;
  lights: Record<string, { light: S; rowLight: R | null; swatch: string }>;
  cards: Record<string, C>;
}
