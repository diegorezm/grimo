import type { CardData } from "@grimo/core";
import type { CardPalette } from "@grimo/tokens";

export interface CardProps {
  data: CardData;
  palette: CardPalette;
  showCover: boolean;
  showDeltas: boolean;
}
