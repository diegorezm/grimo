import { expoClient } from "@better-auth/expo/client";
import { AUTH_BASE_PATH, sharedAuthClientPlugins } from "@grimo/auth/client";
import { createApiClient } from "@grimo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

/** Auth + API clients bound to one server. Each server keeps its own session. */
function createClients(serverUrl: string) {
  const authClient = createAuthClient({
    baseURL: serverUrl,
    basePath: AUTH_BASE_PATH,
    plugins: [
      ...sharedAuthClientPlugins(),
      // Session cookie lives in SecureStore, namespaced per server.
      expoClient({
        scheme: "grimo",
        storagePrefix: `grimo_${serverUrl.replace(/[^a-zA-Z0-9]/g, "_")}`,
        storage: SecureStore,
      }),
    ],
  });

  const api = createApiClient({
    baseUrl: serverUrl,
    credentials: "omit",
    headers: async (): Promise<Record<string, string>> => {
      const cookie = await authClient.getCookie();
      return cookie ? { Cookie: cookie } : {};
    },
  });

  return { authClient, api };
}

export type Clients = ReturnType<typeof createClients>;
export type AuthClient = Clients["authClient"];

const cache = new Map<string, Clients>();

export function getClients(serverUrl: string): Clients {
  let clients = cache.get(serverUrl);
  if (!clients) {
    clients = createClients(serverUrl);
    cache.set(serverUrl, clients);
  }
  return clients;
}
