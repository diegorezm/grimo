import { expoClient } from "@better-auth/expo/client";
import { AUTH_BASE_PATH, sharedAuthClientPlugins } from "@grimo/auth/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "./config";

export const authClient = createAuthClient({
  baseURL: API_URL,
  basePath: AUTH_BASE_PATH,
  plugins: [
    ...sharedAuthClientPlugins(),
    // Stores the session cookie in SecureStore and handles deep-link callbacks.
    expoClient({ scheme: "grimo", storagePrefix: "grimo", storage: SecureStore }),
  ],
});
