import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import type { Database } from "./index";
import * as schema from "./schema";

export interface LibsqlOptions {
  /** `file:/data/grimo.db` for a local SQLite file, or a remote libSQL/Turso URL. */
  url: string;
  authToken?: string;
}

/** SQLite via libSQL — used by the self-hosted Node server. */
export function createLibsqlDb({ url, authToken }: LibsqlOptions) {
  const client = createClient({ url, authToken });
  const db = drizzle(client, { schema });
  return {
    db: db as Database,
    /** Applies the same SQL migrations wrangler applies to D1 (packages/db/migrations). */
    migrate: (migrationsFolder: string) => migrate(db, { migrationsFolder }),
    close: () => client.close(),
  };
}
