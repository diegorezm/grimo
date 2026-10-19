import { cursorQuerySchema } from "@grimo/core";
import { activities, follows } from "@grimo/db";
import { zValidator } from "@hono/zod-validator";
import { eq, inArray, or } from "drizzle-orm";
import { Hono } from "hono";
import type { AppEnv } from "../../env";
import { requireUser } from "../../lib/context";
import { listActivities } from "./service";

/** Fan-out-on-read feed: my activities + activities of people I follow. */
export const feedRoutes = new Hono<AppEnv>().get(
  "/",
  zValidator("query", cursorQuerySchema),
  async (c) => {
    const user = requireUser(c);
    const db = c.get("db");
    const following = db
      .select({ id: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, user.id));

    return c.json(
      await listActivities(db, {
        viewerId: user.id,
        where: or(eq(activities.actorId, user.id), inArray(activities.actorId, following)),
        ...c.req.valid("query"),
      }),
    );
  },
);
