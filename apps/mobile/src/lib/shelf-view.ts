import {
  type BookcaseColor,
  DEFAULT_BOOKCASE_COLOR,
  isBookcaseColor,
  isShelfView,
  type ShelfView,
} from "@grimo/core";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ShelfViewState {
  view: ShelfView;
  setView: (view: ShelfView) => void;
  color: BookcaseColor;
  setColor: (color: BookcaseColor) => void;
}

/**
 * How the shelf shows its books: covers on shelves ("grid") or spines, and the bookcase's color.
 * Saved on the device.
 */
export const useShelfViewStore = create<ShelfViewState>()(
  persist(
    (set) => ({
      view: "spines",
      setView: (view) => set({ view: isShelfView(view) ? view : "spines" }),
      color: DEFAULT_BOOKCASE_COLOR,
      setColor: (color) => set({ color: isBookcaseColor(color) ? color : DEFAULT_BOOKCASE_COLOR }),
    }),
    {
      name: "grimo.shelf-view",
      storage: createJSONStorage(() => ({
        getItem: SecureStore.getItemAsync,
        setItem: SecureStore.setItemAsync,
        removeItem: SecureStore.deleteItemAsync,
      })),
    },
  ),
);
