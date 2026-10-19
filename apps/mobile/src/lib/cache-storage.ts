import type { CacheStorage } from "@grimo/client";
import { createMMKV } from "react-native-mmkv";

const mmkv = createMMKV({ id: "grimo.query-cache" });

/**
 * Query cache storage backed by MMKV: synchronous, fast and without AsyncStorage's ~2 MB
 * per-value limit on Android (the whole cache is saved under a single key).
 */
export const cacheStorage: CacheStorage = {
  getItem: (key) => mmkv.getString(key) ?? null,
  setItem: (key, value) => mmkv.set(key, value),
  removeItem: (key) => {
    mmkv.remove(key);
  },
};
