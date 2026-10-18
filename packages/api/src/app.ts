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
import { contextMiddleware, trustedOrigins } from "./lib/context";
import { errorHandler } from "./lib/errors";

/**
 * Routes MUST stay chained so `AppType` carries every endpoint to the RPC client.
 * New feature? Create `features/<name>/routes.ts` and add one `.route()` here.
 */
export const app = new Hono<AppEnv>()
  .basePath("/api")
  .use(logger())
  .use(
    cors({
      origin: (origin, c) => (trustedOrigins(c.env).includes(origin) ? origin : null),
      credentials: true,
    }),
  )
  .use(contextMiddleware)
  .on(["GET", "POST"], "/auth/*", (c) => c.get("auth").handler(c.req.raw))
  .get("/health", (c) => c.json({ ok: true }))
  .route("/me", meRoutes)
  .route("/users", usersRoutes)
  .route("/books", booksRoutes)
  .route("/shelves", shelvesRoutes)
  .route("/posts", postsRoutes)
  .route("/feed", feedRoutes)
  .route("/stats", statsRoutes);

app.onError(errorHandler);

export type AppType = typeof app;
