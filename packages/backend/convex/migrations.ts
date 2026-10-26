import { Migrations } from "@convex-dev/migrations";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
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

/** Runs every pending migration, in order. `npx convex run migrations:runAll`. */
export const runAll = migrations.runner([internal.migrations.backfillBookCounters]);
