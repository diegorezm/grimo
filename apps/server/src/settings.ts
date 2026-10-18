import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const firstExisting = (...paths: string[]) => paths.map((p) => resolve(p)).find(existsSync);

const dataDir = resolve(process.env.DATA_DIR ?? "./data");

/**
 * Runtime settings for the self-hosted server (not instance config — that is
 * parsed by `parseInstanceConfig`). Defaults work both in Docker and in `pnpm dev`.
 */
export const settings = {
  port: Number(process.env.PORT ?? 3000),
  dataDir,
  databaseUrl: process.env.DATABASE_URL ?? `file:${join(dataDir, "grimo.db")}`,
  databaseAuthToken: process.env.DATABASE_AUTH_TOKEN,
  mediaDir: join(dataDir, "media"),
  // Bundled next to dist/index.mjs; in dev, read straight from packages/db.
  migrationsDir:
    process.env.MIGRATIONS_DIR ??
    firstExisting(join(here, "migrations"), join(here, "../../../packages/db/migrations")),
  // Web build (static SPA). Optional: without it the server is API-only.
  webDir:
    process.env.WEB_DIR ?? firstExisting(join(here, "public"), join(here, "../../web/dist/static")),
};
