import { isThemePreference, type ThemePreference } from "@grimo/core";
import { useSyncExternalStore } from "react";

// Same key as the inline script in index.html (applies the theme before first paint).
const STORAGE_KEY = "grimo.theme";
const listeners = new Set<() => void>();

function read(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isThemePreference(value) ? value : "system";
  } catch {
    return "system";
  }
}

let current = read();

/** `system` removes the attribute so theme.css falls back to prefers-color-scheme. */
function apply(preference: ThemePreference) {
  const root = document.documentElement;
  if (preference === "system") delete root.dataset.theme;
  else root.dataset.theme = preference;
}

export function setThemePreference(preference: ThemePreference) {
  current = preference;
  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Private mode / blocked storage: the choice just won't persist.
  }
  apply(preference);
  for (const listener of listeners) listener();
}

export function useThemePreference() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
  );
}
