import { Migrations } from "@convex-dev/migrations";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { authComponent } from "./auth";
import { countEntries } from "./model/bookStats";

/** Data migrations (`@convex-dev/migrations`). Run with `npx convex run migrations:run`. */
export const migrations = new Migrations<DataModel>(components.migrations);
export const run = migrations.runner();

/**
 * Computes `readerCount`, `ratingSum` and `ratingCount` of every book from its shelf entries.
 * Each book is read and written in one transaction, so it can't race with a shelf mutation.
 * Idempotent: books already counted are recomputed to the same values.
 */
export const backfillBookCounters = migrations.define({
  table: "books",
  migrateOne: async (ctx, book) => {
    const entries = await ctx.db
      .query("shelfEntries")
      .withIndex("by_book", (q) => q.eq("bookId", book._id))
      .collect();
    return countEntries(entries);
  },
});

/**
 * Copies Better Auth's `emailVerified` into `users.emailVerified` for accounts created before
 * the field existed (new and updated accounts are synced by the auth triggers).
 */
export const backfillEmailVerified = migrations.define({
  table: "users",
  migrateOne: async (ctx, user) => {
    if (user.emailVerified !== undefined) return;
    const authUser = await authComponent.getAnyUserById(ctx, user.authId);
    return { emailVerified: authUser?.emailVerified ?? false };
  },
});

/** Runs every pending migration, in order. `npx convex run migrations:runAll`. */
export const runAll = migrations.runner([
  internal.migrations.backfillBookCounters,
  internal.migrations.backfillEmailVerified,
]);
