import { describe, expect, it } from "vitest";
import {
  applyShelfChoice,
  bookcaseGeometry,
  DEFAULT_SHELF_STYLE,
  layoutBookcase,
  presetOf,
  SHELF_PRESETS,
  type ShelfStyle,
  shelfStyleOf,
  shelfStyleSchema,
  spineSize,
  toggleDecor,
} from "./style";

const books = Array.from({ length: 22 }, (_, i) => ({
  key: `e${i}`,
  title: `Livro ${i}`,
  pageCount: 100 + i * 20,
}));
const style = (patch: Partial<ShelfStyle> = {}): ShelfStyle => ({
  ...DEFAULT_SHELF_STYLE,
  ...patch,
});
const keysOf = (layout: ReturnType<typeof layoutBookcase<(typeof books)[number]>>) =>
  layout.rows
    .flat(2)
    .flatMap((piece) =>
      piece.kind === "stack"
        ? piece.books.map((item) => item.book.key)
        : piece.kind === "decor"
          ? []
          : [piece.book.key],
    );

describe("shelf style", () => {
  it("every preset is a valid style", () => {
    for (const preset of SHELF_PRESETS)
      expect(shelfStyleSchema.parse(preset.style)).toEqual(preset.style);
  });

  it("fills a missing or partly broken style with the default", () => {
    expect(shelfStyleOf(undefined)).toEqual(DEFAULT_SHELF_STYLE);
    expect(shelfStyleOf({ model: "arch", material: "plaid" })).toEqual({
      ...DEFAULT_SHELF_STYLE,
      model: "arch",
    });
  });

  it("refuses repeated decor", () => {
    expect(shelfStyleSchema.safeParse(style({ decor: ["plant", "plant"] })).success).toBe(false);
  });

  it("knows a preset and loses it when a layer changes", () => {
    expect(presetOf(SHELF_PRESETS[2]!.style)?.id).toBe("acervo");
    expect(presetOf(toggleDecor(SHELF_PRESETS[2]!.style, "plant"))).toBeNull();
  });

  it("keeps the rainbow with the shelf's own tones", () => {
    expect(applyShelfChoice(style({ finish: "cover" }), { sort: "rainbow" }).finish).toBe("tone");
    expect(
      applyShelfChoice(style({ sort: "rainbow", finish: "tone" }), { finish: "cover" }).sort,
    ).toBe("added");
  });
});

describe("layoutBookcase", () => {
  it("places every book once, in every model and layout", () => {
    for (const model of ["classic", "floating", "arch", "cubbies", "library"] as const) {
      for (const layout of ["standing", "stacks", "covers"] as const) {
        const result = layoutBookcase(books, style({ model, layout }), 390);
        expect(keysOf(result).sort()).toEqual(books.map((book) => book.key).sort());
      }
    }
  });

  it("never overfills a shelf", () => {
    for (const model of ["classic", "cubbies"] as const) {
      const result = layoutBookcase(books, style({ model, decor: ["plant", "globe"] }), 390);
      const cap = bookcaseGeometry(model, 390).capacity;
      for (const cell of result.rows.flat()) {
        const books = cell.filter((piece) => piece.kind !== "decor");
        const used = books.reduce((sum, piece) => sum + piece.width, 0);
        expect(used).toBeLessThanOrEqual(cap);
      }
    }
  });

  it("fills the screen with empty shelves and puts the decor on them", () => {
    const result = layoutBookcase([], style({ decor: ["plant", "candle"] }), 390);
    expect(result.rows).toHaveLength(4);
    expect(result.rows.flat(2).map((piece) => piece.kind)).toEqual(["decor", "decor"]);
  });

  it("two boxes per row for nichos", () => {
    const result = layoutBookcase(books, style({ model: "cubbies" }), 390);
    for (const row of result.rows) expect(row).toHaveLength(2);
  });

  it("orders by height and keeps piles together", () => {
    const tall = layoutBookcase(books, style({ sort: "height", layout: "standing" }), 390);
    const heights = tall.rows
      .flat(2)
      .flatMap((piece) => (piece.kind === "book" ? [piece.height] : []));
    expect(heights).toEqual([...heights].sort((a, b) => b - a));
    const piles = layoutBookcase(books, style({ layout: "stacks" }), 390)
      .rows.flat(2)
      .filter((piece) => piece.kind === "stack");
    expect(piles.length).toBeGreaterThan(0);
    for (const pile of piles) if (pile.kind === "stack") expect(pile.books).toHaveLength(3);
  });

  it("gives the same book the same spine", () => {
    expect(spineSize("Dom Casmurro", 256)).toEqual(spineSize("Dom Casmurro", 256));
    expect(spineSize("A", 560).width).toBeGreaterThan(spineSize("A", 90).width);
  });
});
