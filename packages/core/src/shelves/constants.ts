export const SHELF_STATUSES = ["want_to_read", "reading", "read", "abandoned"] as const;
export type ShelfStatus = (typeof SHELF_STATUSES)[number];

export const SHELF_LABELS: Record<ShelfStatus, string> = {
  want_to_read: "Quero ler",
  reading: "Lendo",
  read: "Lidos",
  abandoned: "Abandonei",
};
