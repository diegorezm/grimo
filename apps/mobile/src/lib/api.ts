import { createApiClient, createQueryClient } from "@grimo/client";
import { authClient } from "./auth-client";
import { API_URL } from "./config";

export const api = createApiClient({
  baseUrl: API_URL,
  credentials: "omit",
  headers: async (): Promise<Record<string, string>> => {
    const cookie = await authClient.getCookie();
    return cookie ? { Cookie: cookie } : {};
  },
});

export const queryClient = createQueryClient();
