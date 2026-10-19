import { crossDomainClient } from "@convex-dev/better-auth/client/plugins";
import { convexSiteUrl, sharedAuthClientPlugins } from "@grimo/client";
import { createAuthClient } from "better-auth/react";

/**
 * Better Auth, served by Convex (convex/http.ts) on another domain than the page. The
 * cross-domain plugin keeps the session cookie (and the last session) in localStorage.
 */
export const authClient = createAuthClient({
  baseURL: convexSiteUrl(import.meta.env.VITE_CONVEX_URL),
  plugins: [...sharedAuthClientPlugins(), crossDomainClient()],
});

export type Session = NonNullable<(typeof authClient)["$Infer"]["Session"]>;
