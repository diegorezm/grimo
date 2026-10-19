/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Convex deployment (https://<name>.convex.cloud). See vite.config.ts. */
  readonly VITE_CONVEX_URL: string;
}
