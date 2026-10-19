import { convexSiteUrl } from "@grimo/client";

/**
 * The Convex deployment the app talks to, fixed at build time (`EXPO_PUBLIC_CONVEX_URL`).
 * Auth lives on the deployment's site URL. In dev, use your machine's LAN IP for a local
 * deployment (e.g. http://192.168.0.10:3210); a cloud deployment works as is.
 */
export const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL ?? "";

if (!CONVEX_URL) {
  throw new Error("EXPO_PUBLIC_CONVEX_URL não definido (veja apps/mobile/.env.example).");
}

export const CONVEX_SITE_URL = convexSiteUrl(CONVEX_URL);
