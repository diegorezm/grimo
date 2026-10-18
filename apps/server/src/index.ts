import { mkdir } from "node:fs/promises";
import { relative } from "node:path";
import { createApp, createServices, parseInstanceConfig } from "@grimo/api";
import { createLibsqlDb } from "@grimo/db/libsql";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { createFsStorage } from "./fs-storage";
import { settings } from "./settings";

/**
 * Self-hosted Grimo: the same API as the Cloudflare Worker, on Node with SQLite.
 * One process serves the API (/api/*) and the web app.
 */
const config = parseInstanceConfig(process.env);

await mkdir(settings.mediaDir, { recursive: true });
const { db, migrate } = createLibsqlDb({
  url: settings.databaseUrl,
  authToken: settings.databaseAuthToken,
});
if (!settings.migrationsDir) throw new Error("Pasta de migrações não encontrada (MIGRATIONS_DIR)");
await migrate(settings.migrationsDir);

const services = createServices({ db, storage: createFsStorage(settings.mediaDir), config });
const app = new Hono().route(
  "/",
  createApp(() => services),
);

if (settings.webDir) {
  // serveStatic expects a path relative to the working directory.
  const root = relative(process.cwd(), settings.webDir) || ".";
  app.use("/*", serveStatic({ root }));
  // SPA fallback (unknown /api/* paths stay 404).
  app.get("*", (c, next) => (c.req.path.startsWith("/api/") ? c.notFound() : next()));
  app.get("*", serveStatic({ root, rewriteRequestPath: () => "/index.html" }));
}

serve({ fetch: app.fetch, port: settings.port }, ({ port }) => {
  console.log(`Grimo (${config.GRIMO_MODE}) em http://localhost:${port}`);
  if (!settings.webDir) console.log("Web não encontrada — servindo só a API.");
});
