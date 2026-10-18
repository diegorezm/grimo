import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { AppEnv } from "./env";
import { booksRoutes } from "./features/books/routes";
import { feedRoutes } from "./features/feed/routes";
import { postsRoutes } from "./features/posts/routes";
import { meRoutes, usersRoutes } from "./features/profiles/routes";
import { shelvesRoutes } from "./features/shelves/routes";
import { statsRoutes } from "./features/stats/routes";
import { contextMiddleware, type ServicesResolver } from "./lib/context";
import { errorHandler } from "./lib/errors";
import { getInstanceInfo } from "./services";

/**
 * Builds the API. Runtimes (apps/api on Workers, apps/server on Node) only provide services.
 * Routes MUST stay chained so `AppType` carries every endpoint to the RPC client.
 * New feature? Create `features/<name>/routes.ts` and add one `.route()` here.
 */
export function createApp(resolveServices: ServicesResolver) {
  const app = new Hono<AppEnv>()
    .basePath("/api")
    .use(logger())
    .use(contextMiddleware(resolveServices))
    .use(
      cors({
        origin: (origin, c) => {
          const { BETTER_AUTH_URL, TRUSTED_ORIGINS } = c.get("config");
          return [BETTER_AUTH_URL, ...TRUSTED_ORIGINS].includes(origin) ? origin : null;
        },
        credentials: true,
      }),
    )
    .on(["GET", "POST"], "/auth/*", (c) => c.get("auth").handler(c.req.raw))
    .get("/health", (c) => c.json({ ok: true }))
    .get("/instance", async (c) => c.json(await getInstanceInfo(c.get("db"), c.get("config"))))
    .route("/me", meRoutes)
    .route("/users", usersRoutes)
    .route("/books", booksRoutes)
    .route("/shelves", shelvesRoutes)
    .route("/posts", postsRoutes)
    .route("/feed", feedRoutes)
    .route("/stats", statsRoutes);

  app.onError(errorHandler);
  return app;
}

export type AppType = ReturnType<typeof createApp>;
