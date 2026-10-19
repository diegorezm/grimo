/**
 * Demo data for trying out the UI (`pnpm seed`). Local/dev deployments only.
 *
 *   pnpm seed                                  # accounts share the password below
 *   pnpm --filter @grimo/backend exec convex run seed:run '{"password":"outra-senha"}'
 *
 * Accounts are created through Better Auth (so sign-in works), everything else goes through the
 * same model functions the app uses, backdated so the feed and stats look lived-in.
 * Re-running is safe: nothing happens once the main reader has books.
 */
import type { BookInput } from "@grimo/core";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalAction, internalMutation } from "./_generated/server";
import { createAuth } from "./auth";
import { env } from "./model/env";
import { searchOpenLibrary } from "./model/openLibrary";
import { type BookKey, catalog, comments, readers } from "./model/seedData";
import { addToShelf, updateShelfEntry } from "./model/shelves";
import { addComment, createPost, setLike } from "./posts";
import { bookInput } from "./schema";
import { setFollow, updateProfile } from "./users";

const DEFAULT_PASSWORD = "grimo-demo";
const HOUR = 60 * 60 * 1000;

const emailOf = (username: string) => `${username.replace(".", "-")}@grimo.test`;

export const run = internalAction({
  args: { password: v.optional(v.string()) },
  handler: async (ctx, { password = DEFAULT_PASSWORD }) => {
    if (env.SITE_URL.startsWith("https://")) {
      throw new Error("Seed é só para desenvolvimento (SITE_URL é https).");
    }
    const auth = createAuth(ctx);
    for (const reader of readers) {
      try {
        await auth.api.signUpEmail({
          body: {
            email: emailOf(reader.username),
            password,
            name: reader.name,
            username: reader.username,
          },
        });
      } catch {
        // Already exists: keep it.
      }
    }

    // Real Open Library id + cover when available; our own data otherwise.
    const books: Record<string, BookInput> = {};
    for (const [key, seed] of Object.entries(catalog)) {
      const items = await searchOpenLibrary(seed.query, 5).catch(() => []);
      const match = items.find((item) => item.coverUrl) ?? items[0];
      books[key] = {
        openLibraryId: match?.openLibraryId ?? `seed-${key}`,
        title: seed.title,
        authors: seed.authors,
        coverUrl: match?.coverUrl ?? null,
        pageCount: seed.pages,
        publishedYear: match?.publishedYear ?? null,
        genres: [seed.genre],
      };
    }

    const result: string = await ctx.runMutation(internal.seed.populate, { books });
    console.log(result);
    return result;
  },
});

export const populate = internalMutation({
  args: { books: v.record(v.string(), bookInput) },
  handler: async (ctx, { books }) => {
    const year = new Date().getFullYear();
    const users = new Map<string, Doc<"users">>();
    for (const reader of readers) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", reader.username))
        .unique();
      if (!user) throw new Error(`Conta de ${reader.username} não foi criada`);
      users.set(reader.username, user);
    }
    const [main, ...others] = readers.map((reader) => ({
      reader,
      user: users.get(reader.username)!,
    }));
    if (!main) return "Nada a semear.";
    if (main.user.bookCount > 0) return "Já semeado: rafa tem livros. Nada a fazer.";

    // A timeline that ends now: follows first (bottom of the feed), then reading.
    let clock = Date.now() - 7 * 24 * HOUR;
    const tick = () => (clock += HOUR);
    const fresh = async (id: Id<"users">) => (await ctx.db.get(id))!;

    // Everyone follows the main reader; the main reader follows everyone but Lu.
    for (const other of others) {
      await setFollow(ctx, await fresh(other.user._id), main.user._id, true, tick());
      if (other.reader.username !== "lu.prado") {
        await setFollow(ctx, await fresh(main.user._id), other.user._id, true, tick());
      }
    }

    const postIds = new Map<string, Id<"posts">[]>();
    for (const { reader, user } of [main, ...others]) {
      await updateProfile(ctx, await fresh(user._id), {
        bio: reader.bio,
        favoriteGenres: reader.genres,
        yearlyGoal: reader.goal,
      });

      const bookIds = new Map<BookKey, Id<"books">>();
      for (const shelf of reader.shelves) {
        const finishedAt = shelf.finished
          ? new Date(`${year}-${shelf.finished}T20:00:00`).getTime()
          : null;
        const at = finishedAt ?? tick();
        // Abandoned books start as "reading" so the progress is recorded first.
        const initial = shelf.status === "abandoned" ? "reading" : shelf.status;
        const entry = await addToShelf(
          ctx,
          user._id,
          { book: books[shelf.book]!, status: initial },
          finishedAt ? at - 14 * 24 * HOUR : at,
        );
        bookIds.set(shelf.book, entry.bookId);
        const patch = {
          ...(shelf.page && { currentPage: shelf.page }),
          ...(shelf.rating && { rating: shelf.rating }),
          ...(finishedAt && { finishedAt: new Date(finishedAt) }),
        };
        if (Object.keys(patch).length > 0) {
          await updateShelfEntry(ctx, user._id, entry._id, patch, at);
        }
        if (shelf.status === "abandoned") {
          await updateShelfEntry(ctx, user._id, entry._id, { status: "abandoned" }, tick());
        }
      }

      const ids: Id<"posts">[] = [];
      for (const post of reader.posts) {
        ids.push(
          await createPost(
            ctx,
            user._id,
            {
              kind: post.kind,
              bookId: post.book ? (bookIds.get(post.book) ?? null) : null,
              rating: post.rating ?? null,
              body: post.body,
              hasSpoilers: post.spoilers ?? false,
            },
            tick(),
          ),
        );
      }
      postIds.set(reader.username, ids);
    }

    // Others like and comment on the main reader's posts; the main reader likes back.
    const mainPosts = postIds.get(main.reader.username) ?? [];
    for (const other of others) {
      for (const postId of mainPosts) await setLike(ctx, other.user._id, postId, true);
      for (const postId of (postIds.get(other.reader.username) ?? []).slice(0, 1)) {
        await setLike(ctx, main.user._id, postId, true);
      }
    }
    for (const comment of comments) {
      const postId = mainPosts[comment.post];
      const author = users.get(comment.from);
      if (postId && author) await addComment(ctx, author._id, postId, comment.body);
    }

    return `Pronto! Entre como ${emailOf(main.reader.username)} (senha: ${DEFAULT_PASSWORD} ou a que você passou).`;
  },
});
