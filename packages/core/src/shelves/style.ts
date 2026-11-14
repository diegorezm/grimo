import { z } from "zod";
import { titleHash } from "./spine";

/**
 * How a shelf looks: the reader builds it from layers (furniture model, material, spine
 * finish, arrangement, order, decor, light), or picks a ready style that sets them all. Every
 * shelf has its own; "Todos os meus livros" has one too. Colors live in `@grimo/tokens`
 * (`shelfMaterials`); this file is the choices, the presets and where each book goes.
 */

export const SHELF_MODELS = [
  "classic",
  "floating",
  "arch",
  "cubbies",
  "library",
  "vitrine",
  "estufa",
] as const;
export type ShelfModel = (typeof SHELF_MODELS)[number];
export const SHELF_MODEL_LABELS: Record<ShelfModel, { name: string; hint: string }> = {
  classic: { name: "Clássica", hint: "Móvel inteiro, moldura reta" },
  floating: { name: "Flutuante", hint: "Prateleiras soltas na parede" },
  arch: { name: "Arco", hint: "Topo redondo e hera, de chalé" },
  cubbies: { name: "Nichos", hint: "Caixinhas, um cantinho por tema" },
  library: { name: "Biblioteca", hint: "Pilastras, escada e luminária" },
  vitrine: { name: "Vitrine", hint: "Cristaleira com frontão e latão" },
  estufa: { name: "Estufa", hint: "Jardim de inverno, vidro em leque" },
};

export const SHELF_MATERIALS = [
  "paper",
  "lilac",
  "rose",
  "sage",
  "night",
  "oak",
  "walnut",
  "plum",
  "pearl",
  "emerald",
] as const;
export type ShelfMaterial = (typeof SHELF_MATERIALS)[number];
export const SHELF_MATERIAL_LABELS: Record<ShelfMaterial, { name: string; hint: string }> = {
  paper: { name: "Papel", hint: "Creme com pauta" },
  lilac: { name: "Lilás", hint: "Lavanda calma" },
  rose: { name: "Rosa", hint: "Fim de tarde" },
  sage: { name: "Sálvia", hint: "Verde de jardim" },
  night: { name: "Noite", hint: "Céu estrelado" },
  oak: { name: "Carvalho", hint: "Madeira clara" },
  walnut: { name: "Nogueira", hint: "Madeira escura" },
  plum: { name: "Ameixa", hint: "Veludo escuro e latão" },
  pearl: { name: "Madrepérola", hint: "Creme furta-cor, friso dourado" },
  emerald: { name: "Esmeralda", hint: "Verde fundo e latão" },
};

export const SPINE_FINISHES = ["cover", "tone", "linen", "leather", "special"] as const;
export type SpineFinish = (typeof SPINE_FINISHES)[number];
export const SPINE_FINISH_LABELS: Record<SpineFinish, { name: string; hint: string }> = {
  cover: { name: "Capa do livro", hint: "A lombada é a borda da capa" },
  tone: { name: "Tons do móvel", hint: "Tudo combinando" },
  linen: { name: "Tecido", hint: "Trama de linho" },
  leather: { name: "Couro e ouro", hint: "Filetes dourados" },
  special: { name: "Edição especial", hint: "Tecido e dourado de colecionador" },
};

export const SHELF_LAYOUTS = ["standing", "stacks", "covers"] as const;
export type ShelfLayout = (typeof SHELF_LAYOUTS)[number];
export const SHELF_LAYOUT_LABELS: Record<ShelfLayout, string> = {
  standing: "Em pé",
  stacks: "Com pilhas",
  covers: "Capas",
};

export const SHELF_SORTS = ["added", "rainbow", "height"] as const;
export type ShelfSort = (typeof SHELF_SORTS)[number];
export const SHELF_SORT_LABELS: Record<ShelfSort, string> = {
  added: "Como coloquei",
  rainbow: "Arco-íris",
  height: "Altura",
};

export const SHELF_DECOR = [
  "plant",
  "candle",
  "frame",
  "mug",
  "star",
  "globe",
  "amethyst",
  "peony",
  "teacup",
  "fern",
  "jar",
] as const;
export type ShelfDecor = (typeof SHELF_DECOR)[number];
export const SHELF_DECOR_LABELS: Record<ShelfDecor, string> = {
  plant: "Planta",
  candle: "Vela",
  frame: "Porta-retrato",
  mug: "Caneca",
  star: "Estrela",
  globe: "Globo",
  amethyst: "Ametista",
  peony: "Peônias",
  teacup: "Xícara de porcelana",
  fern: "Samambaia",
  jar: "Pote de luzinhas",
};
/** Width each object takes on a shelf (it stands between the books). */
export const SHELF_DECOR_WIDTH: Record<ShelfDecor, number> = {
  plant: 46,
  candle: 28,
  frame: 48,
  mug: 38,
  star: 32,
  globe: 44,
  amethyst: 40,
  peony: 46,
  teacup: 46,
  fern: 50,
  jar: 34,
};

export const SHELF_LIGHTS = ["day", "sunset", "lamp", "moon"] as const;
export type ShelfLight = (typeof SHELF_LIGHTS)[number];
export const SHELF_LIGHT_LABELS: Record<ShelfLight, { name: string; hint: string }> = {
  day: { name: "Luz do dia", hint: "Clara e neutra" },
  sunset: { name: "Fim de tarde", hint: "Sol dourado entrando de lado" },
  lamp: { name: "Luminária", hint: "Cada prateleira com sua luz" },
  moon: { name: "Luar", hint: "Prata fria entrando pela janela" },
};

interface ShelfChoices {
  model: readonly ShelfModel[];
  material: readonly ShelfMaterial[];
  finish: readonly SpineFinish[];
  decor: readonly ShelfDecor[];
  light: readonly ShelfLight[];
}

/** The paid choices of each layer (the shop sells them; see docs/loja/plano.md). */
export const SHELF_PREMIUM = {
  model: ["library", "vitrine", "estufa"],
  material: ["walnut", "plum", "pearl", "emerald"],
  finish: ["leather", "special"],
  decor: ["globe", "amethyst", "peony", "teacup", "fern", "jar"],
  light: ["moon"],
} as const satisfies ShelfChoices;
export type ShelfPremiumLayer = keyof typeof SHELF_PREMIUM;

/**
 * The paid choices this repository draws itself ("Acervo": they were free before the shop).
 * Every other paid choice has its art in the private `@grimo/premium` content: a build without
 * it does not offer them, and draws a shelf that uses one with the default look.
 */
export const SHELF_PREMIUM_BUILT_IN = {
  model: ["library"],
  material: ["walnut"],
  finish: ["leather"],
  decor: ["globe"],
  light: [],
} as const satisfies ShelfChoices;

/** True for a paid choice whose art is in this repository. */
export const isBuiltInShelfChoice = (layer: ShelfPremiumLayer, key: string) =>
  (SHELF_PREMIUM_BUILT_IN[layer] as readonly string[]).includes(key);

/** True for a paid choice of `layer`. */
export const isPremiumShelfChoice = (layer: ShelfPremiumLayer, key: string) =>
  (SHELF_PREMIUM[layer] as readonly string[]).includes(key);

export const shelfStyleSchema = z.object({
  model: z.enum(SHELF_MODELS),
  material: z.enum(SHELF_MATERIALS),
  finish: z.enum(SPINE_FINISHES),
  layout: z.enum(SHELF_LAYOUTS),
  sort: z.enum(SHELF_SORTS),
  decor: z
    .array(z.enum(SHELF_DECOR))
    .max(SHELF_DECOR.length)
    .refine((list) => new Set(list).size === list.length, "Enfeite repetido"),
  light: z.enum(SHELF_LIGHTS),
});
export type ShelfStyle = z.infer<typeof shelfStyleSchema>;

/** True when the style uses any paid choice. */
export const isPremiumShelfStyle = (style: ShelfStyle) =>
  isPremiumShelfChoice("model", style.model) ||
  isPremiumShelfChoice("material", style.material) ||
  isPremiumShelfChoice("finish", style.finish) ||
  isPremiumShelfChoice("light", style.light) ||
  style.decor.some((decor) => isPremiumShelfChoice("decor", decor));

export interface ShelfPreset {
  id: string;
  name: string;
  hint: string;
  style: ShelfStyle;
}

/** Ready styles: one tap sets every layer. The first one is every new shelf's. */
export const SHELF_PRESETS: readonly ShelfPreset[] = [
  {
    id: "diario",
    name: "Diário",
    hint: "O Grimo de sempre",
    style: {
      model: "classic",
      material: "paper",
      finish: "cover",
      layout: "stacks",
      sort: "added",
      decor: ["plant", "star"],
      light: "day",
    },
  },
  {
    id: "chale",
    name: "Chalé",
    hint: "Hera, linho e sol de tarde",
    style: {
      model: "arch",
      material: "sage",
      finish: "linen",
      layout: "stacks",
      sort: "added",
      decor: ["plant", "mug", "frame"],
      light: "sunset",
    },
  },
  {
    id: "acervo",
    name: "Acervo",
    hint: "Couro, vela e luminária",
    style: {
      model: "library",
      material: "walnut",
      finish: "leather",
      layout: "standing",
      sort: "height",
      decor: ["candle", "globe"],
      light: "lamp",
    },
  },
  {
    id: "parede",
    name: "Parede limpa",
    hint: "Só prateleiras e livros",
    style: {
      model: "floating",
      material: "paper",
      finish: "cover",
      layout: "standing",
      sort: "added",
      decor: [],
      light: "day",
    },
  },
  {
    id: "galeria",
    name: "Galeria",
    hint: "Capas de frente, em nichos",
    style: {
      model: "cubbies",
      material: "lilac",
      finish: "cover",
      layout: "covers",
      sort: "added",
      decor: ["star", "plant"],
      light: "day",
    },
  },
  {
    id: "romance",
    name: "Romance",
    hint: "Rosa, arco-íris e velas",
    style: {
      model: "arch",
      material: "rose",
      finish: "tone",
      layout: "standing",
      sort: "rainbow",
      decor: ["frame", "candle"],
      light: "sunset",
    },
  },
  {
    id: "estrelas",
    name: "Noite estrelada",
    hint: "Para ler de madrugada",
    style: {
      model: "floating",
      material: "night",
      finish: "tone",
      layout: "stacks",
      sort: "height",
      decor: ["candle", "star"],
      light: "lamp",
    },
  },
  {
    id: "romantasy",
    name: "Romantasy",
    hint: "Ameixa, dourado e luar",
    style: {
      model: "vitrine",
      material: "plum",
      finish: "special",
      layout: "standing",
      sort: "rainbow",
      decor: ["amethyst", "candle"],
      light: "moon",
    },
  },
  {
    id: "cha",
    name: "Chá da tarde",
    hint: "Madrepérola, peônias e porcelana",
    style: {
      model: "classic",
      material: "pearl",
      finish: "special",
      layout: "stacks",
      sort: "added",
      decor: ["peony", "teacup"],
      light: "day",
    },
  },
  {
    id: "jardim",
    name: "Jardim de inverno",
    hint: "Estufa verde, linho e luzinhas",
    style: {
      model: "estufa",
      material: "emerald",
      finish: "linen",
      layout: "stacks",
      sort: "added",
      decor: ["fern", "jar"],
      light: "sunset",
    },
  },
];

export const DEFAULT_SHELF_STYLE: ShelfStyle = SHELF_PRESETS[0]!.style;

/** A stored (or missing, or older) style made whole: anything unknown falls back to the default. */
export function shelfStyleOf(raw: unknown): ShelfStyle {
  const parsed = shelfStyleSchema.partial().safeParse(raw ?? {});
  if (!parsed.success) {
    // Keep each valid field of a style that is only partly valid.
    const out = { ...DEFAULT_SHELF_STYLE };
    if (raw && typeof raw === "object") {
      for (const [key, value] of Object.entries(raw)) {
        const field = shelfStyleSchema.shape[key as keyof ShelfStyle];
        if (field?.safeParse(value).success) Object.assign(out, { [key]: value });
      }
    }
    return out;
  }
  return { ...DEFAULT_SHELF_STYLE, ...parsed.data };
}

/** The preset this style is, if it is exactly one. */
export function presetOf(style: ShelfStyle): ShelfPreset | null {
  return SHELF_PRESETS.find((preset) => sameStyle(preset.style, style)) ?? null;
}

export function sameStyle(a: ShelfStyle, b: ShelfStyle) {
  return (
    a.model === b.model &&
    a.material === b.material &&
    a.finish === b.finish &&
    a.layout === b.layout &&
    a.sort === b.sort &&
    a.light === b.light &&
    a.decor.length === b.decor.length &&
    a.decor.every((item, i) => b.decor[i] === item)
  );
}

/**
 * One choice applied to a style. The rainbow follows the spines' colors, which only the
 * shelf's own tones have (a cover's colors aren't known), so they go together.
 */
export function applyShelfChoice(style: ShelfStyle, patch: Partial<ShelfStyle>): ShelfStyle {
  const next = { ...style, ...patch };
  if (patch.sort === "rainbow" && next.finish === "cover") next.finish = "tone";
  if (patch.finish === "cover" && next.sort === "rainbow") next.sort = "added";
  return next;
}

/** Turns one object on or off. */
export function toggleDecor(style: ShelfStyle, decor: ShelfDecor): ShelfStyle {
  return {
    ...style,
    decor: style.decor.includes(decor)
      ? style.decor.filter((item) => item !== decor)
      : [...style.decor, decor],
  };
}

/** How many different shelves the layers make (shown as a teaser in the editor). */
export const SHELF_COMBINATIONS =
  SHELF_MODELS.length *
  SHELF_MATERIALS.length *
  SPINE_FINISHES.length *
  SHELF_LAYOUTS.length *
  SHELF_SORTS.length *
  SHELF_LIGHTS.length *
  2 ** SHELF_DECOR.length;

// ---------------------------------------------------------------------------------------------
// Where each book goes
// ---------------------------------------------------------------------------------------------

/** Spine colors per material (`shelfMaterials[material].tones` in tokens), in rainbow order. */
export const SPINE_TONES = 7;

export interface SpineSize {
  width: number;
  height: number;
  /** Which of the material's tones (0..SPINE_TONES-1): the same book, the same color. */
  tone: number;
}

/** A book's spine on the bookcase (points): thicker books are wider, heights vary a little. */
export function spineSize(title: string, pageCount: number | null | undefined): SpineSize {
  const h = titleHash(title);
  const pages = Math.min(Math.max(pageCount ?? 250, 80), 560);
  return {
    width: Math.round(23 + ((pages - 80) / 480) * 22),
    height: 132 + ((h >> 3) % 5) * 9,
    tone: h % SPINE_TONES,
  };
}

/**
 * The furniture's measures for a screen `width` (points), shared by web and mobile so the same
 * shelf holds the same books: `side` is the frame on each side, `pad` the room inside a
 * shelf, `cells` how many boxes per row (nichos: 2), `gap` between them.
 */
export function bookcaseGeometry(model: ShelfModel, width: number) {
  const g =
    model === "floating"
      ? { side: 6, pad: 16, cells: 1, gap: 0 }
      : model === "cubbies"
        ? { side: 14, pad: 6, cells: 2, gap: 10 }
        : model === "library"
          ? { side: 26, pad: 10, cells: 1, gap: 0 }
          : model === "vitrine"
            ? { side: 20, pad: 10, cells: 1, gap: 0 }
            : { side: 14, pad: 10, cells: 1, gap: 0 };
  const inner = width - g.side * 2 - g.gap * (g.cells - 1);
  return { ...g, capacity: Math.floor(inner / g.cells - g.pad * 2) };
}

export interface BookcaseBook {
  /** Stable key (the shelf entry id). */
  key: string;
  title: string;
  pageCount?: number | null;
}

export type BookcasePiece<T> =
  | {
      kind: "book";
      key: string;
      book: T;
      width: number;
      height: number;
      tone: number;
      lean: boolean;
    }
  | { kind: "cover"; key: string; book: T; width: number; height: number; tone: number }
  | {
      kind: "stack";
      key: string;
      width: number;
      books: { book: T; length: number; thickness: number; tone: number; shift: number }[];
    }
  | { kind: "decor"; key: string; decor: ShelfDecor; width: number };

export interface Bookcase<T> {
  /** Rows of cells (one cell per row, two for nichos), each with its pieces left to right. */
  rows: BookcasePiece<T>[][][];
  /** Height of the space above each plank. */
  rowHeight: number;
  geometry: ReturnType<typeof bookcaseGeometry>;
}

const GAP_BOOK = 2;
const GAP_COVER = 8;
const GAP_OBJECT = 12;
/** Every third book after the sixth of each nine lies down in a pile ("Com pilhas"). */
const STACK_EVERY = 9;
const STACK_AT = 6;

function widthOf(piece: { kind: BookcasePiece<unknown>["kind"]; width: number }) {
  return (
    piece.width +
    (piece.kind === "book" ? GAP_BOOK : piece.kind === "cover" ? GAP_COVER : GAP_OBJECT)
  );
}

function sortBooks<T extends BookcaseBook>(books: readonly T[], sort: ShelfSort) {
  if (sort === "added") return [...books];
  const sized = books.map((book) => ({ book, size: spineSize(book.title, book.pageCount) }));
  sized.sort((a, b) =>
    sort === "rainbow"
      ? a.size.tone - b.size.tone || a.book.title.localeCompare(b.book.title)
      : b.size.height - a.size.height || b.size.width - a.size.width,
  );
  return sized.map(({ book }) => book);
}

/**
 * Lays a shelf out: books in the chosen order, standing, in piles or face out, filling each
 * shelf left to right; the objects go where there is most room. Always at least `minRows`
 * rows, so the bookcase fills the screen even with few books.
 */
export function layoutBookcase<T extends BookcaseBook>(
  books: readonly T[],
  style: ShelfStyle,
  width: number,
  minRows = 4,
): Bookcase<T> {
  const geometry = bookcaseGeometry(style.model, width);
  const cap = geometry.capacity;
  const small = geometry.cells > 1;
  const covers = style.layout === "covers";
  const ordered = sortBooks(books, style.sort);

  const pieces: BookcasePiece<T>[] = [];
  for (let i = 0; i < ordered.length; ) {
    if (style.layout === "stacks" && i % STACK_EVERY === STACK_AT && i + 2 < ordered.length) {
      const pile = ordered.slice(i, i + 3).map((book, k) => {
        const size = spineSize(book.title, book.pageCount);
        return {
          book,
          length: Math.round(size.height * 0.62),
          thickness: Math.max(15, Math.round(size.width * 0.6)),
          tone: size.tone,
          shift: [-3, 4, 0][k]!,
        };
      });
      const length = Math.min(cap - 20, Math.max(...pile.map((item) => item.length)));
      pieces.push({
        kind: "stack",
        key: `stack-${pile[0]!.book.key}`,
        width: length,
        books: pile.map((item) => ({ ...item, length: Math.min(item.length, length) })),
      });
      i += 3;
      continue;
    }
    const book = ordered[i]!;
    const size = spineSize(book.title, book.pageCount);
    pieces.push(
      covers
        ? {
            kind: "cover",
            key: book.key,
            book,
            width: small ? 64 : 76,
            height: small ? 96 : 114,
            tone: size.tone,
          }
        : {
            kind: "book",
            key: book.key,
            book,
            width: size.width,
            height: size.height,
            tone: size.tone,
            lean: false,
          },
    );
    i++;
  }

  // Fill the cells, leaving room in the first ones for the objects.
  const reserve = style.decor.length > 0 ? 40 : 0;
  const cells: { pieces: BookcasePiece<T>[]; used: number }[] = [];
  let current: BookcasePiece<T>[] = [];
  let used = 0;
  for (const piece of pieces) {
    const room = cap - (cells.length < style.decor.length ? reserve : 0);
    if (used + widthOf(piece) > room && current.length > 0) {
      cells.push({ pieces: current, used });
      current = [];
      used = 0;
    }
    current.push(piece);
    used += widthOf(piece);
  }
  if (current.length > 0) cells.push({ pieces: current, used });
  while (cells.length < minRows * geometry.cells || cells.length % geometry.cells !== 0) {
    cells.push({ pieces: [], used: 0 });
  }

  // Objects: the emptiest cells first, alternating ends.
  const roomiest = cells
    .map((_, index) => index)
    .sort((a, b) => cells[a]!.used - cells[b]!.used || a - b);
  style.decor.forEach((decor, k) => {
    const cell = cells[roomiest[k % roomiest.length]!]!;
    const piece: BookcasePiece<T> = {
      kind: "decor",
      key: `decor-${decor}`,
      decor,
      width: SHELF_DECOR_WIDTH[decor],
    };
    if (cell.used + widthOf(piece) > cap + 10) return;
    if (k % 2 === 1) cell.pieces.unshift(piece);
    else cell.pieces.push(piece);
    cell.used += widthOf(piece);
  });

  // "Com pilhas": the last book of a shelf with room to spare leans on its neighbor.
  if (style.layout === "stacks") {
    for (const cell of cells) {
      const last = cell.pieces[cell.pieces.length - 1];
      if (last?.kind === "book" && cap - cell.used > 24) last.lean = true;
    }
  }

  const rows: BookcasePiece<T>[][][] = [];
  for (let i = 0; i < cells.length; i += geometry.cells) {
    rows.push(cells.slice(i, i + geometry.cells).map((cell) => cell.pieces));
  }
  return {
    rows,
    rowHeight: covers ? (small ? 118 : 136) : 188,
    geometry,
  };
}
