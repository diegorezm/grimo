import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import * as schema from "./schema";

/**
 * Runtime-agnostic database type. Both drivers (D1 on Cloudflare, libSQL/SQLite on
 * self-hosted Node) produce it, so API code never knows where it runs.
 * Drivers live in `@grimo/db/d1` and `@grimo/db/libsql` so each runtime only bundles its own.
 */
export type Database = BaseSQLiteDatabase<"async", unknown, typeof schema>;

export * from "./schema";
export { schema };
