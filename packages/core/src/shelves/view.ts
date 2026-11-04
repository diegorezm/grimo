export const SHELF_VIEWS = ["grid", "spines"] as const;
export type ShelfView = (typeof SHELF_VIEWS)[number];

export const SHELF_VIEW_LABELS: Record<ShelfView, string> = {
  grid: "Capas",
  spines: "Lombadas",
};

export const SHELF_VIEW_HINTS: Record<ShelfView, string> = {
  grid: "Os livros em pé, em grade, com progresso e nota.",
  spines: "Uma prateleira de lombadas; passe o mouse para ver a capa inteira.",
};

export function isShelfView(value: unknown): value is ShelfView {
  return SHELF_VIEWS.includes(value as ShelfView);
}
