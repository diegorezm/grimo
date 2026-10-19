import type { CardTemplate } from "@grimo/core";
import { create } from "zustand";

/** Choices in the card studio. Palette keys come from `cardPalettes` in @grimo/tokens. */
interface CardStudioState {
  template: CardTemplate;
  palette: string;
  showCover: boolean;
  showDeltas: boolean;
  set: (patch: Partial<Omit<CardStudioState, "set">>) => void;
}

export const useCardStudioStore = create<CardStudioState>((set) => ({
  template: "fita",
  palette: "brasa",
  showCover: true,
  showDeltas: true,
  set: (patch) => set(patch),
}));
