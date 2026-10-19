/**
 * Auth pieces shared by web and mobile. Each app creates its own `authClient` with these plugins
 * plus its platform's (web: `crossDomainClient`, mobile: `expoClient`), pointed at the Convex
 * site URL (`CONVEX_SITE_URL`, where convex/http.ts serves /api/auth).
 */
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { usernameClient } from "better-auth/client/plugins";

/** Plugins every client must register so types/endpoints match the server (convex/auth.ts). */
export const sharedAuthClientPlugins = () => [usernameClient(), convexClient()];

/**
 * `https://x.convex.cloud` → `https://x.convex.site` (HTTP actions, where auth lives).
 * Local dev deployments use the next port (3210 → 3211).
 */
export function convexSiteUrl(convexUrl: string) {
  const url = new URL(convexUrl);
  if (url.hostname.endsWith(".convex.cloud")) {
    url.hostname = url.hostname.replace(/\.convex\.cloud$/, ".convex.site");
  } else if (url.port) {
    url.port = String(Number(url.port) + 1);
  }
  return url.origin;
}
