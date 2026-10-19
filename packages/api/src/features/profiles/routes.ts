import { cursorQuerySchema, searchReadersSchema, updateProfileSchema } from "@grimo/core";
import {
  activities,
  type Database,
  follows,
  profiles,
  readingGoals,
  user as users,
} from "@grimo/db";
import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import type { AppEnv } from "../../env";
import { requireSocial, requireUser } from "../../lib/context";
import { notFound } from "../../lib/errors";
import { listActivities } from "../feed/service";
import { getYearOverview } from "../stats/service";
import {
  getProfile,
  getProfileBooks,
  listConnections,
  searchReaders,
  suggestReaders,
} from "./service";

/** Id of the reader with this username, or 404. */
async function findReaderId(db: Database, username: string) {
  const target = await db.query.user.findFirst({
    where: eq(users.username, username.toLowerCase()),
    columns: { id: true },
  });
  if (!target) throw notFound("Leitor");
  return target.id;
}

const isFollowing = (db: Database, followerId: string, followingId: string) =>
  db.query.follows
    .findFirst({
      where: and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)),
    })
    .then(Boolean);

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

/**
 * `/users` — readers. Profiles and their activity are public (shareable links work signed out);
 * search, suggestions and follow lists are social features.
 */
export const usersRoutes = new Hono<AppEnv>()
  .get("/", zValidator("query", searchReadersSchema), async (c) => {
    requireSocial(c);
    const viewer = requireUser(c);
    const query = c.req.valid("query");
    return c.json(await searchReaders(c.get("db"), { viewerId: viewer.id, ...query }));
  })
  .get("/suggestions", zValidator("query", cursorQuerySchema), async (c) => {
    requireSocial(c);
    const viewer = requireUser(c);
    const query = c.req.valid("query");
    return c.json(await suggestReaders(c.get("db"), { viewerId: viewer.id, ...query }));
  })
  .get("/:username", async (c) => {
    const db = c.get("db");
    const viewer = c.get("user");
    const targetId = await findReaderId(db, c.req.param("username"));

    const [profile, stats, books, following, followsYou] = await Promise.all([
      getProfile(db, targetId),
      getYearOverview(db, targetId, new Date().getUTCFullYear()),
      getProfileBooks(db, targetId),
      viewer ? isFollowing(db, viewer.id, targetId) : false,
      viewer ? isFollowing(db, targetId, viewer.id) : false,
    ]);
    return c.json({ profile: profile!, stats, books, isFollowing: following, followsYou });
  })
  .get("/:username/activity", zValidator("query", cursorQuerySchema), async (c) => {
    const db = c.get("db");
    const targetId = await findReaderId(db, c.req.param("username"));
    return c.json(
      await listActivities(db, {
        viewerId: c.get("user")?.id ?? null,
        where: eq(activities.actorId, targetId),
        ...c.req.valid("query"),
      }),
    );
  })
  .get("/:username/followers", zValidator("query", cursorQuerySchema), async (c) => {
    requireSocial(c);
    const db = c.get("db");
    const userId = await findReaderId(db, c.req.param("username"));
    const viewerId = c.get("user")?.id ?? null;
    const query = c.req.valid("query");
    return c.json(await listConnections(db, { userId, kind: "followers", viewerId, ...query }));
  })
  .get("/:username/following", zValidator("query", cursorQuerySchema), async (c) => {
    requireSocial(c);
    const db = c.get("db");
    const userId = await findReaderId(db, c.req.param("username"));
    const viewerId = c.get("user")?.id ?? null;
    const query = c.req.valid("query");
    return c.json(await listConnections(db, { userId, kind: "following", viewerId, ...query }));
  })
  .post("/:id/follow", async (c) => {
    requireSocial(c);
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
    const targetId = c.req.param("id");
    const db = c.get("db");
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, viewer.id), eq(follows.followingId, targetId)));
    // An unfollow takes back the "começou a seguir" line from the feeds.
    await db
      .delete(activities)
      .where(
        and(
          eq(activities.actorId, viewer.id),
          eq(activities.kind, "followed"),
          eq(activities.targetUserId, targetId),
        ),
      );
    return c.json({ following: false });
  });
