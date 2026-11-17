import { bookcaseGeometry, type ShelfStyle, type SpineColors, type SpineFinish } from "@grimo/core";
import type { ViewStyle } from "react-native";
import { shelfBrass, shelfMaterials } from "@/constants/theme";

/**
 * The bookcase's paint: what each furniture model, material and light look like as styles.
 * Colors are the reader's chosen material (`shelfMaterials` tokens), not the app theme, so the
 * same shelf looks the same in light and dark mode.
 */

export type Material = (typeof shelfMaterials)[keyof typeof shelfMaterials];

export const materialOf = (style: ShelfStyle): Material => shelfMaterials[style.material];

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
  return finish === "leather" ? darken(color, 0.38) : color;
}

/** Text on a spine of this color. */
export function spineInk(material: Material, tone: number, finish: SpineFinish) {
  if (finish === "leather") return shelfBrass.light;
  return lightness(material.tones[tone % material.tones.length]!) > 0.62
    ? shelfBrass.ink
    : shelfBrass.paper;
}

/** What a spine is painted with. */
export interface SpinePaint {
  base: string;
  /** The band at the head of the spine (only spines in their cover's colors have one). */
  band: string | null;
  ink: string;
}

/**
 * A spine's paint: with "Capa do livro" and the cover's colors known, the book's own; else one
 * of the material's tones (plain, linen or leather).
 */
export function spinePaint(
  material: Material,
  tone: number,
  finish: SpineFinish,
  colors?: SpineColors | null,
): SpinePaint {
  if (finish === "cover" && colors) return colors;
  const paint: SpineFinish = finish === "cover" ? "tone" : finish;
  return {
    base: spineColor(material, tone, paint),
    band: null,
    ink: spineInk(material, tone, paint),
  };
}

/**
 * Light on a round spine: dark at both edges where it turns away, a bright line a third of the
 * way in, a little light from above and shade at the foot. Paperbacks shine more.
 */
export function spineShade(hard: boolean): ViewStyle {
  const shine = hard ? 0.16 : 0.3;
  return {
    backgroundImage: [
      `linear-gradient(90deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 15%, rgba(255,255,255,${shine}) 34%, rgba(255,255,255,0.04) 52%, rgba(0,0,0,0.1) 74%, rgba(0,0,0,0.55) 100%)`,
      "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 20%, rgba(0,0,0,0) 82%, rgba(0,0,0,0.2) 100%)",
    ].join(", "),
  };
}

/** The two grooves where a hardcover's boards fold, near each edge of the spine. */
export const SPINE_JOINTS: ViewStyle = {
  backgroundImage:
    "linear-gradient(90deg, rgba(0,0,0,0) 8%, rgba(0,0,0,0.34) 8%, rgba(0,0,0,0.34) 9.5%, rgba(255,255,255,0.2) 9.5%, rgba(255,255,255,0.2) 11%, rgba(0,0,0,0) 11%, rgba(0,0,0,0) 89%, rgba(255,255,255,0.2) 89%, rgba(255,255,255,0.2) 90.5%, rgba(0,0,0,0.34) 90.5%, rgba(0,0,0,0.34) 92%, rgba(0,0,0,0) 92%)",
};

/** The striped cloth headband at the top of a hardcover. */
export const HEADBAND: ViewStyle = {
  backgroundImage: "linear-gradient(90deg, #a8323a 0%, #a8323a 50%, #f1e6d0 50%, #f1e6d0 100%)",
  backgroundSize: "4px 4px",
  backgroundRepeat: "repeat",
};

/** Page edges: lines front to back (seen from above a spine) or across (above a cover). */
export const pagesSeen = (across: boolean): ViewStyle => ({
  backgroundColor: "#ece0c8",
  backgroundImage: `linear-gradient(${across ? 180 : 90}deg, #f7efdf 0%, #f7efdf 50%, #dccdb0 50%, #dccdb0 100%)`,
  backgroundSize: "2px 2px",
  backgroundRepeat: "repeat",
});

/** The far end of the top of a book sits in the shelf's shadow. */
export const TOP_SHADE: ViewStyle = {
  backgroundImage: "linear-gradient(180deg, rgba(40,20,50,0.35) 0%, rgba(40,20,50,0) 85%)",
};

/** A book's own shadow: in the gap beside it and up on the back of the shelf. */
export const BOOK_SHADOW = "3px 0 3px -1px rgba(35,15,50,0.45), 12px -3px 16px rgba(30,15,50,0.22)";

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
  /** The furniture's sides seen a little from the front (depth); null: no sides. */
  sides: { width: number; left: ViewStyle; right: ViewStyle } | null;
}

/** Everything that changes with the model and the light. `top` is the room for the header. */
export function modelLook(style: ShelfStyle, width: number, top: number): ModelLook {
  const m = materialOf(style);
  const g = bookcaseGeometry(style.model, width);
  const panel: ViewStyle = { backgroundColor: m.back, boxShadow: DEPTH, ...backPattern(style) };
  const look: ModelLook = {
    frame: { backgroundColor: m.side, ...grainOf(m) },
    crown: {
      height: top,
      boxShadow: "inset 0 -8px 0 rgba(0,0,0,0.08), inset 0 -12px 0 rgba(255,255,255,0.14)",
    },
    inner: { marginHorizontal: g.side, ...panel },
    cell: {},
    row: { paddingHorizontal: g.pad, boxShadow: "inset 0 -20px 22px -18px rgba(0,0,0,0.24)" },
    // The plank's top recedes into the shade at the back; its front edge catches the light.
    plankTop: {
      height: 10,
      backgroundColor: m.plankTop,
      backgroundImage:
        "linear-gradient(180deg, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0) 60%, rgba(255,255,255,0.18) 100%)",
    },
    plank: {
      height: 14,
      backgroundColor: m.plank,
      backgroundImage:
        "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 25%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.12) 100%)",
      boxShadow: "0 8px 12px -6px rgba(0,0,0,0.35)",
      zIndex: 1,
    },
    light: null,
    rowLight: null,
    sides:
      style.model === "classic" || style.model === "library"
        ? {
            width: g.side,
            left: {
              backgroundImage:
                "linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(0,0,0,0.16) 100%)",
            },
            right: {
              backgroundImage:
                "linear-gradient(270deg, rgba(255,255,255,0.3) 0%, rgba(0,0,0,0.16) 100%)",
            },
          }
        : null,
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

  if (style.light === "lamp") {
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
