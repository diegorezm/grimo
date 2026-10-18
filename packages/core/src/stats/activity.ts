import { SHELF_LABELS, type ShelfStatus } from "../shelves/constants";

export const ACTIVITY_KINDS = ["shelved", "progress", "finished", "posted", "followed"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

/** Human sentence for a feed item (shared copy for web + mobile). */
export function describeActivity(kind: ActivityKind, data: Record<string, unknown> | null): string {
  switch (kind) {
    case "shelved": {
      const status = data?.status as ShelfStatus | undefined;
      return status ? `adicionou à estante “${SHELF_LABELS[status]}”` : "adicionou um livro";
    }
    case "progress":
      return `está na página ${String(data?.page ?? "?")}`;
    case "finished":
      return "terminou de ler";
    case "posted":
      return "publicou";
    case "followed":
      return "começou a seguir alguém";
  }
}
