import type { D1Database, R2Bucket } from "@cloudflare/workers-types";
import type { Auth, AuthSession, AuthUser } from "@grimo/auth";
import type { Database } from "@grimo/db";

/** Worker bindings. Keep in sync with apps/api/wrangler.jsonc. */
export interface Bindings {
  DB: D1Database;
  MEDIA: R2Bucket;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  /** Comma-separated list of allowed origins (web + mobile scheme). */
  TRUSTED_ORIGINS: string;
}

export interface AppEnv {
  Bindings: Bindings;
  Variables: {
    db: Database;
    auth: Auth;
    user: AuthUser | null;
    session: AuthSession["session"] | null;
  };
}
