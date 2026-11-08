import { FEELING_LABELS, type Feeling, formatRating } from "../ratings";
import type { ShelfStatus } from "./constants";

/** What the notice says after moving a book between shelves ("Duna foi para Lendo"). */
export function shelfMoveMessage(title: string, status: ShelfStatus): string {
  switch (status) {
    case "want_to_read":
      return `${title} está em Quero ler`;
    case "reading":
      return `${title} foi para Lendo`;
    case "read":
      return `${title} está nos seus Lidos`;
    case "abandoned":
      return `${title} foi para Abandonei`;
  }
}

/** "Nota 4,5 salva", or "Nota apagada" when the rating was cleared. */
export const ratingSavedMessage = (rating: number | null) =>
  rating === null ? "Nota apagada" : `Nota ${formatRating(rating)} salva`;

/** "Sentimentos salvos: Tensão, Medo", or that they were cleared. */
export const feelingsSavedMessage = (feelings: readonly Feeling[]) =>
  feelings.length === 0
    ? "Sentimentos apagados"
    : `Sentimentos salvos: ${feelings.map((feeling) => FEELING_LABELS[feeling]).join(", ")}`;
