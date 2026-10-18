import { type Database, follows, profiles, readingGoals, user as users } from "@grimo/db";
import { and, eq, sql } from "drizzle-orm";

/** Public profile: auth user + reader profile + current-year goal + follow counts. */
export async function getProfile(db: Database, userId: string) {
  const year = new Date().getUTCFullYear();
  const row = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      image: users.image,
      bio: profiles.bio,
      favoriteGenres: profiles.favoriteGenres,
      yearlyGoal: readingGoals.target,
      followers: sql<number>`(select count(*) from ${follows} where ${follows.followingId} = ${users.id})`,
      following: sql<number>`(select count(*) from ${follows} where ${follows.followerId} = ${users.id})`,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .leftJoin(readingGoals, and(eq(readingGoals.userId, users.id), eq(readingGoals.year, year)))
    .where(eq(users.id, userId))
    .get();

  if (!row) return null;
  return { ...row, favoriteGenres: row.favoriteGenres ?? [] };
}
