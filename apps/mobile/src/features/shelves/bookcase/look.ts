import { bookcaseGeometry, type ShelfStyle, type SpineFinish } from "@grimo/core";
import type { Art, MaterialTokens } from "@grimo/premium";
import type { ViewStyle } from "react-native";
import { shelfBrass, shelfMaterials } from "@/constants/theme";
import { premium, premiumTokens } from "@/lib/premium";

/**
 * The bookcase's paint: what each furniture model, material and light look like as styles.
 * Colors are the reader's chosen material (`shelfMaterials` tokens), not the app theme, so the
 * same shelf looks the same in light and dark mode.
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
export const SPINE_GLOSS: ViewStyle = {
  backgroundImage:
    "linear-gradient(90deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0) 30%, rgba(0,0,0,0) 66%, rgba(0,0,0,0.24) 100%)",
};

/** Linen weave: a tiny diagonal tile, repeated. */
export const LINEN: ViewStyle = {
  backgroundImage:
    "linear-gradient(45deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.12) 50%, rgba(0,0,0,0) 50%)",
  backgroundSize: "4px 4px",
  backgroundRepeat: "repeat",
};

/** Wood grain: thin vertical stripes. */
export const grainOf = (material: Material): ViewStyle =>
  material.grain
    ? {
        backgroundImage: `linear-gradient(90deg, ${material.grain} 0%, ${material.grain} 20%, rgba(0,0,0,0) 20%)`,
        backgroundSize: "7px 7px",
        backgroundRepeat: "repeat",
      }
    : {};

/** The back panel's pattern: ruled lines on paper, stars at night. */
export function backPattern(style: ShelfStyle): ViewStyle {
  if (style.material === "paper") {
    return {
      backgroundImage:
        "linear-gradient(0deg, rgba(220,201,214,0.45) 0px, rgba(220,201,214,0.45) 1px, rgba(0,0,0,0) 1px)",
      backgroundSize: "24px 24px",
      backgroundRepeat: "repeat",
    };
  }
  if (style.material === "night") {
    return {
      backgroundImage:
        "radial-gradient(circle at 20% 30%, rgba(255,240,200,0.9) 0px, rgba(255,240,200,0) 1.5px), radial-gradient(circle at 70% 65%, rgba(214,174,85,0.8) 0px, rgba(214,174,85,0) 1.5px)",
      backgroundSize: "70px 60px",
      backgroundRepeat: "repeat",
    };
  }
  return {};
}

/** Inner shadows that make the back panel sit deeper than the frame. */
const DEPTH =
  "inset 14px 0 20px -14px rgba(0,0,0,0.35), inset -14px 0 20px -14px rgba(0,0,0,0.35), inset 0 14px 18px -12px rgba(0,0,0,0.3)";

/** What a paid finish puts over the spine's color (nothing for the free ones). */
export const bindingLayers = (finish: SpineFinish): ViewStyle[] =>
  premium.finishes[finish]?.binding ?? [];

/** The ornament over a paid model (drawn at the foot of the crown), if it has one. */
export const crownArtOf = (style: ShelfStyle): Art | null =>
  premium.models[style.model] ? (premiumTokens.crowns[style.model] ?? null) : null;

/** Over the shelves of a paid model (glass, reflections), if it has one. */
export function modelOver(style: ShelfStyle, width: number, top: number): ViewStyle | null {
  const art = premium.models[style.model];
  if (!art?.over) return null;
  const look = modelLook({ ...style, model: "classic" }, width, top);
  return art.over({ style, width, top, material: materialOf(style), look });
}

export interface ModelLook {
  /** The whole piece of furniture (behind everything). */
  frame: ViewStyle;
  /** Space above the first shelf (under the floating header). */
  crown: ViewStyle;
  /** The back panel holding the shelves. */
  inner: ViewStyle;
  /** One cell (a shelf; a box for nichos). */
  cell: ViewStyle;
  /** The room for books above each plank. */
  row: ViewStyle;
  plankTop: ViewStyle;
  plank: ViewStyle;
  /** Over the whole bookcase: the light. */
  light: ViewStyle | null;
  /** Lit from above (luminária): a glow under each plank. */
  rowLight: ViewStyle | null;
}

/** Everything that changes with the model and the light. `top` is the room for the header. */
export function modelLook(style: ShelfStyle, width: number, top: number): ModelLook {
  const m = materialOf(style);
  const g = bookcaseGeometry(style.model, width);
  const panel: ViewStyle = {
    backgroundColor: m.back,
    boxShadow: DEPTH,
    ...(premium.backPatterns[style.material] ?? backPattern(style)),
  };
  let look: ModelLook = {
    frame: { backgroundColor: m.side, ...grainOf(m) },
    crown: {
      height: top,
      boxShadow: "inset 0 -8px 0 rgba(0,0,0,0.08), inset 0 -12px 0 rgba(255,255,255,0.14)",
    },
    inner: { marginHorizontal: g.side, ...panel },
    cell: {},
    row: { paddingHorizontal: g.pad, boxShadow: "inset 0 -20px 22px -18px rgba(0,0,0,0.24)" },
    plankTop: {
      height: 8,
      backgroundColor: m.plankTop,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
    },
    plank: {
      height: 14,
      backgroundColor: m.plank,
      boxShadow: m.trim
        ? `inset 0 2px 0 ${m.trim}, 0 8px 12px -6px rgba(0,0,0,0.35)`
        : "0 8px 12px -6px rgba(0,0,0,0.35)",
      zIndex: 1,
    },
    light: null,
    rowLight: null,
  };

  if (style.model === "floating") {
    look.frame = {};
    look.crown = { height: top };
    look.inner = { marginHorizontal: g.side };
    look.row = { paddingHorizontal: g.pad };
    look.cell = { marginBottom: 34 };
    look.plankTop = { height: 5, marginHorizontal: 6, backgroundColor: m.plankTop };
    look.plank = {
      height: 10,
      marginHorizontal: 6,
      borderBottomLeftRadius: 2,
      borderBottomRightRadius: 2,
      backgroundColor: m.plank,
      boxShadow: "0 14px 18px -10px rgba(0,0,0,0.35)",
    };
  }
  if (style.model === "arch") {
    const radius = width / 2;
    look.frame = {
      ...look.frame,
      marginTop: Math.max(0, top - 70),
      borderTopLeftRadius: radius,
      borderTopRightRadius: radius,
    };
    look.crown = { height: 14 };
    look.inner = {
      ...look.inner,
      paddingTop: 96,
      borderTopLeftRadius: radius - g.side,
      borderTopRightRadius: radius - g.side,
    };
    look.cell = { marginBottom: 10 };
  }
  if (style.model === "cubbies") {
    look.inner = { marginHorizontal: g.side };
    look.cell = {
      marginBottom: 10,
      borderRadius: 3,
      overflow: "hidden",
      ...panel,
      boxShadow: "inset 8px 8px 16px -8px rgba(0,0,0,0.3), inset -6px 0 12px -8px rgba(0,0,0,0.2)",
    };
    look.row = { paddingHorizontal: g.pad };
    look.plankTop = { height: 6, backgroundColor: m.plankTop };
    look.plank = { height: 0 };
  }
  if (style.model === "library") {
    look.crown = {
      height: top + 16,
      backgroundImage:
        "linear-gradient(180deg, rgba(0,0,0,0) 70%, rgba(0,0,0,0.18) 70%, rgba(0,0,0,0.18) 74%, rgba(0,0,0,0) 74%)",
      boxShadow: "inset 0 -8px 0 rgba(0,0,0,0.12)",
    };
  }

  const model = premium.models[style.model];
  if (model) {
    look = { ...look, ...model.look({ style, width, top, material: m, look }) };
  }

  const light = premium.lights[style.light];
  if (light) {
    look.rowLight = light.rowLight;
    look.light = light.light;
  } else if (style.light === "lamp") {
    look.rowLight = {
      backgroundImage:
        "radial-gradient(ellipse at 50% 0%, rgba(255,205,120,0.5) 0%, rgba(255,205,120,0) 60%)",
    };
    look.light = {
      backgroundImage:
        "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0) 30%, rgba(20,12,30,0.42) 100%)",
    };
  } else if (style.light === "sunset") {
    look.light = {
      backgroundImage:
        "linear-gradient(200deg, rgba(255,176,96,0.26) 0%, rgba(255,176,96,0) 55%), linear-gradient(0deg, rgba(150,70,110,0.10) 0%, rgba(0,0,0,0) 45%)",
    };
  }
  return look;
}
