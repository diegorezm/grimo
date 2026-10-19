import { bookSearchQuerySchema } from "@grimo/core";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { AppEnv } from "../../env";
import { requireUser } from "../../lib/context";
import { notFound } from "../../lib/errors";
import { searchOpenLibrary } from "./open-library";
import { getBookDetail } from "./service";

export const booksRoutes = new Hono<AppEnv>()
  .get("/search", zValidator("query", bookSearchQuerySchema), async (c) => {
    const { q } = c.req.valid("query");
    const items = await searchOpenLibrary(q);
    c.header("Cache-Control", "public, max-age=3600");
    return c.json({ items });
  })
  // Book page, by Open Library work id (works for books nobody has shelved yet).
  .get("/:openLibraryId", async (c) => {
    const user = requireUser(c);
    const detail = await getBookDetail(c.get("db"), user.id, c.req.param("openLibraryId"));
    if (!detail) throw notFound("Livro");
    return c.json(detail);
  });
