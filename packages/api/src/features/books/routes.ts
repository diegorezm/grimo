import { bookSearchQuerySchema } from "@grimo/core";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { AppEnv } from "../../env";
import { searchOpenLibrary } from "./open-library";

export const booksRoutes = new Hono<AppEnv>().get(
  "/search",
  zValidator("query", bookSearchQuerySchema),
  async (c) => {
    const { q } = c.req.valid("query");
    const items = await searchOpenLibrary(q);
    c.header("Cache-Control", "public, max-age=3600");
    return c.json({ items });
  },
);
