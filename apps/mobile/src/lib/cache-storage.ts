import type { CacheStorage } from "@grimo/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants, { ExecutionEnvironment } from "expo-constants";

/** Expo Go has no MMKV (a native module), so it falls back to AsyncStorage there. */
const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Query cache storage. Development and store builds use MMKV: synchronous, fast and without
 * AsyncStorage's ~2 MB per-value limit on Android (the whole cache is saved under a single key).
 * In Expo Go, AsyncStorage keeps the app usable for quick testing.
 */
export const cacheStorage: CacheStorage = inExpoGo ? asyncStorage() : mmkvStorage();

function mmkvStorage(): CacheStorage {
  // Required lazily: importing it at the top would crash Expo Go.
  const { createMMKV } = require("react-native-mmkv") as typeof import("react-native-mmkv");
  const mmkv = createMMKV({ id: "grimo.query-cache" });
  return {
    getItem: (key) => mmkv.getString(key) ?? null,
    setItem: (key, value) => mmkv.set(key, value),
    removeItem: (key) => {
      mmkv.remove(key);
    },
  };
}

function asyncStorage(): CacheStorage {
  return {
    getItem: (key) => AsyncStorage.getItem(key),
    setItem: (key, value) => AsyncStorage.setItem(key, value),
    removeItem: (key) => AsyncStorage.removeItem(key),
  };
}
