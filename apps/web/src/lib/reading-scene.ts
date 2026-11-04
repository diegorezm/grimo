import { isReadingScene, type ReadingScene } from "@grimo/core";
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "grimo.reading-scene";
const listeners = new Set<() => void>();

function read(): ReadingScene {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "off") return "none";
    return isReadingScene(value) ? value : "forest";
  } catch {
    return "forest";
  }
}

let current = read();

/** The theme behind the reading timer, on this device. */
export function setReadingScene(scene: ReadingScene) {
  current = scene;
  try {
    localStorage.setItem(STORAGE_KEY, scene);
  } catch {
    // Private mode / blocked storage: the choice just won't persist.
  }
  for (const listener of listeners) listener();
}

export function useReadingScene() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
  );
}
