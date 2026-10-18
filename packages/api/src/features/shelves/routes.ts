import { addToShelfSchema, shelfQuerySchema, updateShelfEntrySchema } from "@grimo/core";
import { books, shelfEntries } from "@grimo/db";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import type { AppEnv } from "../../env";
import { requireUser } from "../../lib/context";
import { addToShelf, updateShelfEntry } from "./service";

export const shelvesRoutes = new Hono<AppEnv>()
  .get("/", zValidator("query", shelfQuerySchema), async (c) => {
    const user = requireUser(c);
    const { status } = c.req.valid("query");
    const items = await c
      .get("db")
      .select({ entry: shelfEntries, book: books })
      .from(shelfEntries)
      .innerJoin(books, eq(books.id, shelfEntries.bookId))
      .where(
        and(eq(shelfEntries.userId, user.id), status ? eq(shelfEntries.status, status) : undefined),
      )
      .orderBy(desc(shelfEntries.updatedAt));
    return c.json({ items });
  })
  .post("/", zValidator("json", addToShelfSchema), async (c) => {
    const user = requireUser(c);
    const entry = await addToShelf(c.get("db"), user.id, c.req.valid("json"));
    return c.json({ entry }, 201);
  })
  .patch("/:id", zValidator("json", updateShelfEntrySchema), async (c) => {
    const user = requireUser(c);
    const entry = await updateShelfEntry(
      c.get("db"),
      user.id,
      c.req.param("id"),
      c.req.valid("json"),
    );
    return c.json({ entry });
  })
  .delete("/:id", async (c) => {
    const user = requireUser(c);
    await c
      .get("db")
      .delete(shelfEntries)
      .where(and(eq(shelfEntries.id, c.req.param("id")), eq(shelfEntries.userId, user.id)));
    return c.body(null, 204);
  });
