import { isShelfView, type ShelfView } from "@grimo/core";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ShelfViewState {
  view: ShelfView;
  setView: (view: ShelfView) => void;
}

/** How the shelf shows its books: covers on shelves ("grid") or spines. Saved on the device. */
export const useShelfViewStore = create<ShelfViewState>()(
  persist(
    (set) => ({
      view: "spines",
      setView: (view) => set({ view: isShelfView(view) ? view : "spines" }),
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
