import { expoClient } from "@better-auth/expo/client";
import { ConvexCache, createQueryClient, sharedAuthClientPlugins } from "@grimo/client";
import { createAuthClient } from "better-auth/react";
import { ConvexReactClient } from "convex/react";
import * as SecureStore from "expo-secure-store";
import { CONVEX_SITE_URL, CONVEX_URL } from "./server";

/**
 * Better Auth, served by Convex. The session cookie (and the last session, so the app opens
 * offline) lives in SecureStore.
 */
export const authClient = createAuthClient({
  baseURL: CONVEX_SITE_URL,
  plugins: [
    ...sharedAuthClientPlugins(),
    expoClient({ scheme: "grimo", storagePrefix: "grimo", storage: SecureStore }),
  ],
});

export type AuthClient = typeof authClient;

/** Set by AppProviders: what to do when the server rejects the session. */
let onUnauthorized = () => {};
export const setOnUnauthorized = (handler: () => void) => {
  onUnauthorized = handler;
};

export const cache = new ConvexCache(
  new ConvexReactClient(CONVEX_URL, { unsavedChangesWarning: false }),
  { onUnauthorized: () => onUnauthorized() },
);
export const queryClient = createQueryClient({
  convex: cache,
  onUnauthorized: () => onUnauthorized(),
});
