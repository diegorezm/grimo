import type { ThemePreference } from "@grimo/core";
import * as SecureStore from "expo-secure-store";
import { Appearance } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Light / dark / system. Applied through `Appearance.setColorScheme`, so every
 * `useColorScheme()` (our theme hook, navigation, native UI) follows the choice.
 */
function apply(preference: ThemePreference) {
  Appearance.setColorScheme(preference === "system" ? "unspecified" : preference);
}

interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: "system",
      setPreference: (preference) => {
        apply(preference);
        set({ preference });
      },
    }),
    {
      name: "grimo.theme",
      storage: createJSONStorage(() => ({
        getItem: SecureStore.getItemAsync,
        setItem: SecureStore.setItemAsync,
        removeItem: SecureStore.deleteItemAsync,
      })),
      onRehydrateStorage: () => (state) => {
        if (state) apply(state.preference);
      },
    },
  ),
);
