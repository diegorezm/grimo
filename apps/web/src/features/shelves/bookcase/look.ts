import { bookcaseGeometry, type ShelfStyle, type SpineFinish } from "@grimo/core";
import type { Art, MaterialTokens } from "@grimo/premium";
import { shelfBrass, shelfMaterials } from "@grimo/tokens";
import type { CSSProperties } from "react";
import { premium, premiumTokens } from "@/lib/premium";

/**
 * The bookcase's paint as CSS (the web twin of mobile's `bookcase/look.ts`). Colors are the
 * reader's chosen material (`shelfMaterials` tokens), not the app theme: the same shelf looks
 * the same in light and dark mode.
 */

export type Material = MaterialTokens;

const FREE_MATERIALS: Record<string, Material> = shelfMaterials;

/** A material's colors: free ones from the tokens, paid ones from the content (else paper). */
export const materialByKey = (key: string): Material =>
  FREE_MATERIALS[key] ?? premiumTokens.shelfMaterials[key] ?? shelfMaterials.paper;

export const materialOf = (style: ShelfStyle): Material => materialByKey(style.material);

function channels(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
}

/** Perceived lightness, 0..1. */
export function lightness(hex: string) {
  const [r, g, b] = channels(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** The color darkened by `amount` (0..1). */
export function darken(hex: string, amount: number) {
  const [r, g, b] = channels(hex).map((c) => Math.round(c * (1 - amount)));
  return `rgb(${r},${g},${b})`;
}

/** A spine's color: one of the material's tones (darker for leather). */
export function spineColor(material: Material, tone: number, finish: SpineFinish) {
  const color = material.tones[tone % material.tones.length]!;
  const art = premium.finishes[finish];
  if (art) return darken(color, art.deepen);
  return finish === "leather" ? darken(color, 0.38) : color;
}

/** Text on a spine of this color. */
export function spineInk(material: Material, tone: number, finish: SpineFinish) {
  if (finish === "leather") return shelfBrass.light;
  const light = lightness(material.tones[tone % material.tones.length]!) > 0.62;
  const art = premium.finishes[finish];
  if (art) return art.ink(light);
  return light ? shelfBrass.ink : shelfBrass.paper;
}

/** Light on a round spine: bright on the left edge, shadow on the right. */
export const GLOSS =
  "linear-gradient(90deg, rgba(255,255,255,.26) 0, rgba(255,255,255,0) 30%, rgba(0,0,0,0) 66%, rgba(0,0,0,.24) 100%)";
/** The same light on a book lying down. */
export const GLOSS_LYING = GLOSS.replace("90deg", "180deg");
/** Linen weave. */
export const LINEN =
  "repeating-linear-gradient(45deg, rgba(255,255,255,.1) 0 1.5px, transparent 1.5px 4px), repeating-linear-gradient(-45deg, rgba(0,0,0,.07) 0 1.5px, transparent 1.5px 4px)";
/** A thin light band near the head of a spine. */
const BAND =
  "linear-gradient(to bottom, transparent 14px, rgba(255,255,255,.4) 14px, rgba(255,255,255,.4) 15px, transparent 15px)";
/** Gilt lines at the head and foot of a leather spine. */
const GOLD = (() => {
  const g = shelfBrass.base;
  const stop = (from: string, to: string) =>
    `transparent ${from}, ${g} ${from}, ${g} ${to}, transparent ${to}`;
  return `linear-gradient(to bottom, ${stop("10px", "12px")}, ${stop("15px", "16px")}, ${stop("calc(100% - 16px)", "calc(100% - 15px)")}, ${stop("calc(100% - 12px)", "calc(100% - 10px)")})`;
})();

/** The binding over a spine (gloss first), for each finish. */
export function bindingOf(finish: SpineFinish) {
  const art = premium.finishes[finish];
  if (art) return `${GLOSS}, ${art.binding}`;
  if (finish === "leather") return `${GLOSS}, ${GOLD}`;
  if (finish === "linen") return `${GLOSS}, ${LINEN}, ${BAND}`;
  return `${GLOSS}, ${BAND}`;
}

/** The wall behind the furniture (and the whole page around it). */
export function wallOf(style: ShelfStyle): string {
  return materialOf(style).room;
}

/** Wood grain: thin vertical stripes. */
const grainOf = (m: Material) =>
  m.grain ? `repeating-linear-gradient(90deg, ${m.grain} 0 1px, transparent 1px 7px)` : null;

/** The back panel's pattern: ruled lines on paper, stars at night. */
function backPattern(style: ShelfStyle) {
  if (style.material === "paper") {
    return "repeating-linear-gradient(0deg, rgba(220,201,214,.45) 0 1px, transparent 1px 24px)";
  }
  if (style.material === "night") {
    return "radial-gradient(1.2px 1.2px at 12px 18px, rgba(255,240,200,.9), transparent) 0 0 / 70px 60px, radial-gradient(1.4px 1.4px at 48px 42px, rgba(214,174,85,.8), transparent) 0 0 / 70px 60px";
  }
  return null;
}

const layers = (...parts: (string | null)[]) => parts.filter(Boolean).join(", ");

/** Inner shadows that make the back panel sit deeper than the frame. */
const DEPTH =
  "inset 14px 0 20px -14px rgba(0,0,0,.35), inset -14px 0 20px -14px rgba(0,0,0,.35), inset 0 14px 18px -12px rgba(0,0,0,.3)";

/** The ornament over a paid model (drawn at the foot of the crown), if it has one. */
export const crownArtOf = (style: ShelfStyle): Art | null =>
  premium.models[style.model] ? (premiumTokens.crowns[style.model] ?? null) : null;

/** Over the shelves of a paid model (glass, reflections), if it has one. */
export function modelOver(style: ShelfStyle, width: number): CSSProperties | null {
  const art = premium.models[style.model];
  if (!art?.over) return null;
  const look = modelLook({ ...style, model: "classic" }, width);
  return art.over({ style, width, top: 56, material: materialOf(style), look });
}

export interface ModelLook {
  frame: CSSProperties;
  crown: CSSProperties;
  inner: CSSProperties;
  cell: CSSProperties;
  row: CSSProperties;
  plankTop: CSSProperties;
  plank: CSSProperties;
  /** Over the whole bookcase: the light. */
  light: CSSProperties | null;
  /** Lit from above (luminária): a glow under each plank. */
  rowLight: string | null;
  bracket: string;
}

/** Everything that changes with the model and the light; `width` is the bookcase's. */
export function modelLook(style: ShelfStyle, width: number): ModelLook {
  const m = materialOf(style);
  const g = bookcaseGeometry(style.model, width);
  const pattern = premium.backPatterns[style.material];
  const panel: CSSProperties = pattern
    ? { backgroundColor: m.back, ...pattern, boxShadow: DEPTH }
    : { background: layers(backPattern(style), m.back), boxShadow: DEPTH };
  let look: ModelLook = {
    frame: { background: layers(grainOf(m), m.side) },
    crown: {
      height: 56,
      boxShadow: "inset 0 -8px 0 rgba(0,0,0,.08), inset 0 -12px 0 rgba(255,255,255,.14)",
    },
    inner: { margin: `0 ${g.side}px`, ...panel },
    cell: {},
    row: { padding: `0 ${g.pad}px`, boxShadow: "inset 0 -20px 22px -18px rgba(0,0,0,.24)" },
    plankTop: {
      height: 8,
      background: m.plankTop,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.45)",
    },
    plank: {
      height: 14,
      background: m.plank,
      boxShadow: m.trim
        ? `inset 0 2px 0 ${m.trim}, 0 8px 12px -6px rgba(0,0,0,.35)`
        : "0 8px 12px -6px rgba(0,0,0,.35)",
      position: "relative",
      zIndex: 1,
    },
    light: null,
    rowLight: null,
    bracket: darken(m.plank, 0.35),
  };

  if (style.model === "floating") {
    look.frame = {};
    look.crown = { height: 56 };
    look.inner = { margin: `0 ${g.side}px` };
    look.row = { padding: `0 ${g.pad}px` };
    look.cell = { marginBottom: 34 };
    look.plankTop = { height: 5, margin: "0 6px", background: m.plankTop };
    look.plank = {
      height: 10,
      margin: "0 6px",
      borderRadius: "0 0 2px 2px",
      background: m.plank,
      boxShadow: "0 14px 18px -10px rgba(0,0,0,.35)",
    };
  }
  if (style.model === "arch") {
    const radius = width / 2;
    look.frame = {
      ...look.frame,
      marginTop: 14,
      borderRadius: `${radius}px ${radius}px 0 0 / 220px 220px 0 0`,
    };
    look.crown = { height: 14 };
    look.inner = {
      ...look.inner,
      paddingTop: 110,
      borderRadius: `${radius - g.side}px ${radius - g.side}px 0 0 / 206px 206px 0 0`,
    };
    look.cell = { marginBottom: 10 };
  }
  if (style.model === "cubbies") {
    look.inner = { margin: `0 ${g.side}px` };
    look.cell = {
      marginBottom: 10,
      borderRadius: 3,
      overflow: "hidden",
      ...panel,
      boxShadow: "inset 8px 8px 16px -8px rgba(0,0,0,.3), inset -6px 0 12px -8px rgba(0,0,0,.2)",
    };
    look.row = { padding: `0 ${g.pad}px` };
    look.plankTop = { height: 6, background: m.plankTop };
    look.plank = { height: 0 };
  }
  if (style.model === "library") {
    look.crown = {
      height: 92,
      background:
        "linear-gradient(180deg, transparent 54px, rgba(0,0,0,.18) 54px, rgba(0,0,0,.18) 58px, transparent 58px), repeating-linear-gradient(90deg, rgba(0,0,0,.18) 0 8px, transparent 8px 15px) 0 64px / 100% 12px no-repeat",
      boxShadow: "inset 0 -8px 0 rgba(0,0,0,.12)",
    };
  }

  const model = premium.models[style.model];
  if (model) {
    look = { ...look, ...model.look({ style, width, top: 56, material: m, look }) };
  }

  const light = premium.lights[style.light];
  if (light) {
    look.rowLight = light.rowLight;
    look.light = light.light;
  } else if (style.light === "lamp") {
    look.rowLight =
      "radial-gradient(ellipse 60% 95% at 50% 0%, rgba(255,205,120,.5), rgba(255,205,120,0) 70%)";
    look.light = {
      background: "radial-gradient(ellipse 90% 70% at 50% 40%, transparent, rgba(20,12,30,.42))",
    };
  } else if (style.light === "sunset") {
    look.rowLight =
      "linear-gradient(105deg, transparent 40%, rgba(255,190,110,.20) 60%, transparent 75%)";
    look.light = {
      background:
        "linear-gradient(200deg, rgba(255,176,96,.26), rgba(255,176,96,0) 55%), linear-gradient(0deg, rgba(150,70,110,.10), transparent 45%)",
    };
  }
  return look;
}
