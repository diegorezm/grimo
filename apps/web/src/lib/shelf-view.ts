import { isShelfView, type ShelfView } from "@grimo/core";
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "grimo.shelfView";
const listeners = new Set<() => void>();

function read(): ShelfView {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isShelfView(value) ? value : "grid";
  } catch {
    return "grid";
  }
}

let current = read();

export function setShelfView(view: ShelfView) {
  current = view;
  try {
    localStorage.setItem(STORAGE_KEY, view);
  } catch {
    // Private mode / blocked storage: the choice just won't persist.
  }
  for (const listener of listeners) listener();
}

/** How the shelf is shown (a display preference, kept on this device like the theme). */
export function useShelfView() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
  );
}
