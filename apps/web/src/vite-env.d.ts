/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Convex deployment (https://<name>.convex.cloud). See vite.config.ts. */
  readonly VITE_CONVEX_URL: string;
  /** Public origin of the web app (https://grimo.app), for canonical URLs, sitemap and OG tags. */
  readonly VITE_SITE_URL?: string;
}
