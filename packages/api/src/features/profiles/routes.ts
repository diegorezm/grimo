import { updateProfileSchema } from "@grimo/core";
import { activities, follows, profiles, readingGoals, user as users } from "@grimo/db";
import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import type { AppEnv } from "../../env";
import { requireUser } from "../../lib/context";
import { notFound } from "../../lib/errors";
import { getYearOverview } from "../stats/service";
import { getProfile } from "./service";

/** `/me` — the signed-in reader. */
export const meRoutes = new Hono<AppEnv>()
  .get("/", async (c) => {
    const user = requireUser(c);
    const profile = await getProfile(c.get("db"), user.id);
    return c.json(profile!);
  })
  .patch("/", zValidator("json", updateProfileSchema), async (c) => {
    const user = requireUser(c);
    const db = c.get("db");
    const { name, bio, favoriteGenres, yearlyGoal } = c.req.valid("json");

    if (name !== undefined) await db.update(users).set({ name }).where(eq(users.id, user.id));
    if (bio !== undefined || favoriteGenres !== undefined) {
      await db
        .insert(profiles)
        .values({ userId: user.id, bio, favoriteGenres })
        .onConflictDoUpdate({ target: profiles.userId, set: { bio, favoriteGenres } });
    }
    if (yearlyGoal !== undefined) {
      const year = new Date().getUTCFullYear();
      if (yearlyGoal === null) {
        await db
          .delete(readingGoals)
          .where(and(eq(readingGoals.userId, user.id), eq(readingGoals.year, year)));
      } else {
        await db
          .insert(readingGoals)
          .values({ userId: user.id, year, target: yearlyGoal })
          .onConflictDoUpdate({
            target: [readingGoals.userId, readingGoals.year],
            set: { target: yearlyGoal },
          });
      }
    }
    return c.json((await getProfile(db, user.id))!);
  });

/** `/users` — public reader profiles and follows. */
export const usersRoutes = new Hono<AppEnv>()
  .get("/:username", async (c) => {
    const db = c.get("db");
    const viewer = c.get("user");
    const target = await db.query.user.findFirst({
      where: eq(users.username, c.req.param("username").toLowerCase()),
      columns: { id: true },
    });
    if (!target) throw notFound("Leitor");

    const [profile, stats, following] = await Promise.all([
      getProfile(db, target.id),
      getYearOverview(db, target.id, new Date().getUTCFullYear()),
      viewer
        ? db.query.follows.findFirst({
            where: and(eq(follows.followerId, viewer.id), eq(follows.followingId, target.id)),
          })
        : undefined,
    ]);
    return c.json({ profile: profile!, stats, isFollowing: Boolean(following) });
  })
  .post("/:id/follow", async (c) => {
    const viewer = requireUser(c);
    const targetId = c.req.param("id");
    if (targetId === viewer.id) return c.json({ error: "Você não pode seguir a si mesmo" }, 400);

    const db = c.get("db");
    const inserted = await db
      .insert(follows)
      .values({ followerId: viewer.id, followingId: targetId })
      .onConflictDoNothing()
      .returning();
    if (inserted.length > 0) {
      await db
        .insert(activities)
        .values({ actorId: viewer.id, kind: "followed", targetUserId: targetId });
    }
    return c.json({ following: true });
  })
  .delete("/:id/follow", async (c) => {
    const viewer = requireUser(c);
    await c
      .get("db")
      .delete(follows)
      .where(and(eq(follows.followerId, viewer.id), eq(follows.followingId, c.req.param("id"))));
    return c.json({ following: false });
  });
