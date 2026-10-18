import type { AppType } from "@grimo/api";
import { hc } from "hono/client";

export interface ApiClientOptions {
  /** Origin that serves `/api/*` (web: same origin, mobile: the API worker URL). */
  baseUrl: string;
  /** Extra headers per request (mobile uses it to send the Better Auth cookie). */
  headers?: () => Record<string, string> | Promise<Record<string, string>>;
  fetch?: typeof fetch;
  /** Web: "include" (cookie). Mobile: "omit" — the cookie goes in `headers`. */
  credentials?: RequestCredentials;
}

/** Fully typed RPC client generated from the Hono `AppType` — no codegen. */
export function createApiClient({
  baseUrl,
  headers,
  fetch,
  credentials = "include",
}: ApiClientOptions) {
  return hc<AppType>(baseUrl, { headers, fetch, init: { credentials } }).api;
}

export type ApiClient = ReturnType<typeof createApiClient>;
