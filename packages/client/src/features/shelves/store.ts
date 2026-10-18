import type { ShelfStatus } from "@grimo/core";
import { create } from "zustand";

interface ShelfTabState {
  status: ShelfStatus;
  setStatus: (status: ShelfStatus) => void;
}

/** Client-only UI state shared by web and mobile (selected shelf tab). */
export const useShelfTabStore = create<ShelfTabState>((set) => ({
  status: "reading",
  setStatus: (status) => set({ status }),
}));
