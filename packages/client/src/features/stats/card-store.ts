import type { CardTemplate, FinishedCardTemplate } from "@grimo/core";
import { create } from "zustand";

/** Choices in the card studio. Palette keys come from `cardPalettes` in @grimo/tokens. */
interface CardStudioState {
  template: CardTemplate;
  bookTemplate: FinishedCardTemplate;
  palette: string;
  showCover: boolean;
  showDeltas: boolean;
  showBookDetails: boolean;
  set: (patch: Partial<Omit<CardStudioState, "set">>) => void;
}

export const useCardStudioStore = create<CardStudioState>((set) => ({
  template: "fita",
  bookTemplate: "cantinho",
  palette: "noite",
  showCover: true,
  showDeltas: true,
  showBookDetails: true,
  set: (patch) => set(patch),
}));
