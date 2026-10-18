import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Which Grimo server the app talks to. Grimo can be self-hosted, so the user picks
 * the server on the sign-in screen (like Immich/Jellyfin). Default comes from the build.
 * Physical device in dev: your LAN IP. Android emulator: http://10.0.2.2:5173.
 */
export const DEFAULT_SERVER_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5173";

/** `meu-grimo.com/` → `https://meu-grimo.com`. */
export function normalizeServerUrl(input: string) {
  const trimmed = input.trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

interface ServerState {
  serverUrl: string;
  setServerUrl: (url: string) => void;
}

export const useServerStore = create<ServerState>()(
  persist(
    (set) => ({
      serverUrl: DEFAULT_SERVER_URL,
      setServerUrl: (url) => set({ serverUrl: normalizeServerUrl(url) }),
    }),
    {
      name: "grimo.server",
      storage: createJSONStorage(() => ({
        getItem: SecureStore.getItemAsync,
        setItem: SecureStore.setItemAsync,
        removeItem: SecureStore.deleteItemAsync,
      })),
    },
  ),
);
