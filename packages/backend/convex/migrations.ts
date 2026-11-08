import { Migrations } from "@convex-dev/migrations";
import { MAX_SHELF_NAME, MAX_SHELVES_PER_BOOK, matchesShelfFilter } from "@grimo/core";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { authComponent } from "./auth";
import { countEntries } from "./model/bookStats";
import { deleteList } from "./model/lists";

/** Data migrations (`@convex-dev/migrations`). Run with `npx convex run migrations:run`. */
export const migrations = new Migrations<DataModel>(components.migrations);
export const run = migrations.runner();

/**
 * Computes the community counters of every book (readers, ratings, star bars, feelings) from
 * its shelf entries.
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

/**
 * Lists were removed from the app (saved shelves and tags took their place): deletes every
 * list with its books. After it ran on every deployment, `lists` and `listItems` can leave the
 * schema.
 */
export const dropLists = migrations.define({
  table: "lists",
  migrateOne: async (ctx, list) => {
    await deleteList(ctx, list);
  },
});

/**
 * Saved shelves (named filters) were replaced by shelves the reader makes: each one becomes a
 * shelf, with the same name and visibility, holding the books its filter showed at that moment.
 * After it ran on every deployment, `savedShelves` can leave the schema.
 */
export const savedShelvesToShelves = migrations.define({
  table: "savedShelves",
  migrateOne: async (ctx, saved) => {
    const tags = await ctx.db
      .query("shelfTags")
      .withIndex("by_user", (q) => q.eq("userId", saved.userId))
      .collect();
    const taken = new Set(tags.map((tag) => tag.name.toLowerCase()));
    let name = saved.name;
    for (let n = 2; taken.has(name.toLowerCase()); n++) name = `${saved.name} ${n}`;
    const shelfId = await ctx.db.insert("shelfTags", {
      userId: saved.userId,
      name: name.slice(0, MAX_SHELF_NAME),
      isPublic: saved.isPublic,
      createdAt: saved.createdAt,
    });

    const entries = await ctx.db
      .query("shelfEntries")
      .withIndex("by_user_updated", (q) => q.eq("userId", saved.userId))
      .collect();
    const filter = { ...saved.filter, tagIds: saved.filter.tagIds as string[] };
    for (const entry of entries) {
      const book = await ctx.db.get(entry.bookId);
      const row = {
        entry: { status: entry.status, tagIds: (entry.tagIds ?? []) as string[] },
        book: { genres: book?.genres ?? [] },
      };
      const current = entry.tagIds ?? [];
      if (book && matchesShelfFilter(row, filter) && current.length < MAX_SHELVES_PER_BOOK) {
        await ctx.db.patch(entry._id, { tagIds: [...current, shelfId] });
      }
    }
    await ctx.db.delete(saved._id);
  },
});

/** Runs every pending migration, in order. `npx convex run migrations:runAll`. */
export const runAll = migrations.runner([
  internal.migrations.backfillBookCounters,
  internal.migrations.backfillEmailVerified,
  internal.migrations.dropLists,
  internal.migrations.savedShelvesToShelves,
]);
