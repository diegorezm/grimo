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
import { type BookInput, PRIVACY_VERSION, TERMS_VERSION } from "@grimo/core";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalAction, internalMutation } from "./_generated/server";
import { createAuth } from "./auth";
import { env } from "./model/env";
import { ensureReading, freeInviteCode, joinGroup } from "./model/groups";
import { acceptLegal, legalStatus } from "./model/legal";
import { searchOpenLibrary } from "./model/openLibrary";
import { type BookKey, catalog, comments, group, readers } from "./model/seedData";
import { addToShelf, bookByOpenLibraryId, updateShelfEntry } from "./model/shelves";
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
    // Better Auth user id of each reader (new account, or the existing one on a re-run).
    const authIds: Record<string, string> = {};
    for (const reader of readers) {
      const body = { email: emailOf(reader.username), password };
      const result = await auth.api
        .signUpEmail({ body: { ...body, name: reader.name } })
        .catch(() => auth.api.signInEmail({ body }));
      authIds[reader.username] = result.user.id;
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

    const result: string = await ctx.runMutation(internal.seed.populate, { books, authIds });
    console.log(result);
    return result;
  },
});

export const populate = internalMutation({
  args: { books: v.record(v.string(), bookInput), authIds: v.record(v.string(), v.string()) },
  handler: async (ctx, { books, authIds }) => {
    const year = new Date().getFullYear();
    const users = new Map<string, Doc<"users">>();
    for (const reader of readers) {
      const authId = authIds[reader.username] ?? "";
      const user = await ctx.db
        .query("users")
        .withIndex("by_authId", (q) => q.eq("authId", authId))
        .unique();
      if (!user) throw new Error(`Conta de ${reader.username} não foi criada`);
      // Demo readers skip the onboarding: their @ is the one in the seed data.
      await ctx.db.patch(user._id, {
        username: reader.username,
        searchText: `${reader.name} ${reader.username}`,
        setupDone: true,
      });
      // ...and are adults who agreed to the current Terms and Privacy Policy.
      const seeded = (await ctx.db.get(user._id))!;
      if ((await legalStatus(ctx, seeded)).needsAcceptance) {
        await acceptLegal(ctx, seeded, {
          accepted: true,
          termsVersion: TERMS_VERSION,
          privacyVersion: PRIVACY_VERSION,
          birthDate: "1995-05-20",
          source: "web",
        });
      }
      users.set(reader.username, (await ctx.db.get(user._id))!);
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
          ...(shelf.pages && { pageCount: shelf.pages }),
          ...(shelf.page && { currentPage: shelf.page }),
          ...(shelf.rating && { rating: shelf.rating }),
          ...(finishedAt && { finishedAt: new Date(finishedAt) }),
        };
        if (Object.keys(patch).length > 0) {
          const note = shelf.note ? { body: shelf.note, hasSpoilers: false } : undefined;
          await updateShelfEntry(ctx, user._id, entry._id, patch, at, note);
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

    // Juntos: the main reader and two friends reading one book, with a few messages.
    const groupInput = books[group.book];
    const groupBook = groupInput ? await bookByOpenLibraryId(ctx, groupInput.openLibraryId) : null;
    if (groupBook) {
      const createdAt = tick();
      const groupId = await ctx.db.insert("groups", {
        bookId: groupBook._id,
        ownerId: main.user._id,
        inviteCode: await freeInviteCode(ctx),
        finishBy: Date.now() + 21 * 24 * HOUR,
        memberCount: 1,
        createdAt,
        lastMessageAt: null,
      });
      await ctx.db.insert("groupMembers", { groupId, userId: main.user._id, joinedAt: createdAt });
      for (const username of group.members) {
        const member = users.get(username);
        if (!member) continue;
        await joinGroup(ctx, member, (await ctx.db.get(groupId))!);
        await ensureReading(ctx, member._id, groupBook, tick());
      }
      for (const message of group.messages) {
        const author = users.get(message.from);
        if (!author) continue;
        const at = tick();
        await ctx.db.insert("groupMessages", {
          groupId,
          authorId: author._id,
          body: message.body,
          percent: message.percent,
          createdAt: at,
        });
        await ctx.db.patch(groupId, { lastMessageAt: at });
      }
    }

    return `Pronto! Entre como ${emailOf(main.reader.username)} (senha: ${DEFAULT_PASSWORD} ou a que você passou).`;
  },
});

const MODERATION_DEMO_MARKER = "GR-demo-modera";

/**
 * Moderation panel demo: enough open reports, hand-added books and history rows to page through
 * (`pnpm --filter @grimo/backend exec convex run seed:moderation`). Run `seed:run` first.
 * Safe to re-run: it stops when the demo books exist.
 */
export const moderation = internalMutation({
  args: {},
  handler: async (ctx) => {
    const marker = await ctx.db
      .query("books")
      .withIndex("by_openLibraryId", (q) => q.eq("openLibraryId", `${MODERATION_DEMO_MARKER}-1`))
      .unique();
    if (marker) return "Moderação já semeada. Nada a fazer.";

    const byName = async (username: string) =>
      ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", username))
        .unique();
    const [rafa, bia, caio, lu, theo] = await Promise.all(
      ["rafa", "bia.lima", "caio", "lu.prado", "theo"].map(byName),
    );
    if (!rafa || !bia || !caio || !lu || !theo) return "Rode seed:run antes: faltam os leitores.";

    const now = Date.now();
    const authors = [caio, lu, theo];
    const reporters = [bia, lu, caio, theo];
    const reasons = ["spam", "spoiler", "other", "harassment", "copyright"] as const;
    const texts = [
      "Compre seguidores baratos, chama no privado!",
      "O final de Duna é que ele vira o Kwisatz Haderach e ninguém percebe.",
      "Esse livro é uma porcaria e quem gostou não entende nada de leitura.",
      "Vendo PDF de todos os livros do semestre, link na bio.",
      "Resenha copiada de outro site, palavra por palavra.",
      "Ninguém merece ler isso, só gente sem cérebro gosta.",
      "Promoção imperdível de e-readers, acesse já.",
      "Spoiler: o mordomo é o assassino, e ainda morre no último capítulo.",
    ];

    // Open reports: posts by caio, lu and theo, filed by someone else, oldest first.
    for (let i = 0; i < 24; i++) {
      const author = authors[i % authors.length]!;
      const others = reporters.filter((user) => user._id !== author._id);
      const reporter = others[i % others.length]!;
      const body = texts[i % texts.length]!;
      const postId = await ctx.db.insert("posts", {
        authorId: author._id,
        bookId: null,
        kind: "note",
        rating: null,
        body: `${body} (#${i + 1})`,
        hasSpoilers: false,
        likeCount: 0,
        commentCount: 0,
      });
      await ctx.db.insert("reports", {
        reporterId: reporter._id,
        target: "post",
        targetId: postId,
        targetUserId: author._id,
        reason: reasons[i % reasons.length]!,
        details: i % 4 === 0 ? "Já é a segunda vez que vejo isso hoje." : null,
        snapshot: `${body} (#${i + 1})`,
        status: "open",
        createdAt: now - (30 - i) * 60 * 60 * 1000,
        resolvedAt: null,
      });
    }
    // A reader report, and one about an admin (moderators don't see this one).
    await ctx.db.insert("reports", {
      reporterId: bia._id,
      target: "user",
      targetId: theo._id,
      targetUserId: theo._id,
      reason: "harassment",
      details: "Manda mensagens insistentes nos comentários.",
      snapshot: `${theo.name} (@${theo.username}): ${theo.bio ?? ""}`,
      status: "open",
      createdAt: now - 40 * 60 * 60 * 1000,
      resolvedAt: null,
    });
    await ctx.db.insert("reports", {
      reporterId: caio._id,
      target: "user",
      targetId: rafa._id,
      targetUserId: rafa._id,
      reason: "other",
      details: "Teste: denúncia sobre alguém da equipe.",
      snapshot: `${rafa.name} (@${rafa.username}): ${rafa.bio ?? ""}`,
      status: "open",
      createdAt: now - 39 * 60 * 60 * 1000,
      resolvedAt: null,
    });

    // Hand-added books waiting for review.
    const titles = [
      ["Contos da Vila", "Fulana de Tal"],
      ["O Sertão em Cartas", "Beltrano Souza"],
      ["Mapas de Sal", "Marina Duarte"],
      ["A Casa dos Ventos", "João Pereira"],
      ["Diário de uma Biblioteca", "Clara Menezes"],
      ["Rios Invisíveis", "Paulo Andrade"],
      ["Noites de Inverno em Curitiba", "Helena Braga"],
      ["Os Cadernos de Ana", "Ana Lúcia Reis"],
      ["Poeira e Estrelas", "Tiago Moreira"],
      ["A Última Estação", "Renata Lopes"],
    ] as const;
    for (let i = 0; i < 22; i++) {
      const [title, author] = titles[i % titles.length]!;
      await ctx.db.insert("books", {
        openLibraryId: `${MODERATION_DEMO_MARKER}-${i + 1}`,
        title: i < titles.length ? title : `${title} (vol. ${Math.floor(i / titles.length) + 1})`,
        authors: [author],
        coverUrl: null,
        pageCount: i % 3 === 0 ? null : 120 + i * 11,
        publishedYear: i % 2 === 0 ? 2015 + (i % 10) : null,
        genres: [],
        createdBy: authors[i % authors.length]!._id,
        reviewStatus: "pending",
      });
    }

    // History: a mix of everything the panel records, newest last in the loop.
    const actions = [
      ["dismiss", caio, "post"],
      ["remove", lu, "post"],
      ["suspend", theo, "7 d: spam repetido"],
      ["unsuspend", theo, null],
      ["book_approve", null, null],
      ["book_reject", null, null],
    ] as const;
    for (let i = 0; i < 26; i++) {
      const [action, target, details] = actions[i % actions.length]!;
      await ctx.db.insert("moderationLog", {
        actorId: rafa._id,
        action,
        targetUserId: target?._id ?? null,
        targetId: target ? null : `${MODERATION_DEMO_MARKER}-${i + 1}`,
        details,
        createdAt: now - (60 - i) * 60 * 60 * 1000,
      });
    }
    return "Moderação semeada: 26 denúncias, 22 livros e 26 ações no histórico.";
  },
});

/**
 * More moderation demo data, to try the report cards: the same post reported by several readers,
 * reported comments and Juntos messages, posts with a book and a rating, and past reports that
 * were already dealt with (so accounts and reporters have a record).
 * `pnpm --filter @grimo/backend exec convex run seed:moderationExtras` (after `seed:moderation`).
 */
export const moderationExtras = internalMutation({
  args: {},
  handler: async (ctx) => {
    const done = await ctx.db
      .query("reports")
      .withIndex("by_status_created", (q) => q.eq("status", "dismissed"))
      .first();
    if (done) return "Extras de moderação já semeados. Nada a fazer.";

    const byName = async (username: string) =>
      ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", username))
        .unique();
    const [rafa, bia, caio, lu, theo] = await Promise.all(
      ["rafa", "bia.lima", "caio", "lu.prado", "theo"].map(byName),
    );
    if (!rafa || !bia || !caio || !lu || !theo) return "Rode seed:run antes: faltam os leitores.";
    const now = Date.now();
    const HOURS = 60 * 60 * 1000;
    const others = (user: Doc<"users">) =>
      [bia, caio, lu, theo, rafa].filter((candidate) => candidate._id !== user._id);

    // Past reports, already decided: the accounts below now have a record.
    const past = [
      [caio, bia, "spam", "actioned", "Perfil usado para divulgar links."],
      [caio, lu, "harassment", "dismissed", null],
      [theo, bia, "spoiler", "dismissed", null],
      [theo, caio, "spam", "actioned", "Postou o mesmo anúncio em três resenhas."],
      [theo, lu, "other", "dismissed", "Achei estranho, mas parece normal."],
      [lu, theo, "hate", "dismissed", null],
    ] as const;
    for (const [target, reporter, reason, status, details] of past) {
      await ctx.db.insert("reports", {
        reporterId: reporter._id,
        target: "user",
        targetId: target._id,
        targetUserId: target._id,
        reason,
        details,
        snapshot: `${target.name} (@${target.username}): ${target.bio ?? ""}`,
        status,
        createdAt: now - 200 * HOURS,
        resolvedAt: now - 190 * HOURS,
      });
    }
    await ctx.db.insert("moderationLog", {
      actorId: rafa._id,
      action: "suspend",
      targetUserId: caio._id,
      targetId: null,
      details: "7 d: divulgação de links",
      createdAt: now - 190 * HOURS,
    });
    await ctx.db.insert("moderationLog", {
      actorId: rafa._id,
      action: "remove",
      targetUserId: theo._id,
      targetId: null,
      details: "post",
      createdAt: now - 189 * HOURS,
    });

    // Some of the open posts become reviews of a real book, so cards show book and rating.
    const book = await ctx.db.query("books").first();
    const openReports = await ctx.db
      .query("reports")
      .withIndex("by_status_created", (q) => q.eq("status", "open"))
      .take(40);
    const postReports = openReports.filter((report) => report.target === "post");
    for (const [index, report] of postReports.slice(0, 8).entries()) {
      const postId = ctx.db.normalizeId("posts", report.targetId);
      if (postId && book && index % 2 === 0) {
        await ctx.db.patch(postId, {
          bookId: book._id,
          kind: "review",
          rating: 1 + (index % 5),
          likeCount: index,
          commentCount: index % 3,
        });
      }
    }

    // The same posts reported again by other readers, with other reasons.
    const reasons = ["harassment", "spam", "other", "hate", "spoiler"] as const;
    for (const [index, report] of postReports.slice(0, 10).entries()) {
      const author = report.targetUserId ? await ctx.db.get(report.targetUserId) : null;
      if (!author) continue;
      const pool = others(author).filter((user) => user._id !== report.reporterId);
      const extra = 1 + (index % 3);
      for (let i = 0; i < extra; i++) {
        const reporter = pool[i % pool.length]!;
        const reason = reasons[(index + i) % reasons.length]!;
        await ctx.db.insert("reports", {
          reporterId: reporter._id,
          target: "post",
          targetId: report.targetId,
          targetUserId: report.targetUserId,
          reason,
          details: reason === "other" ? "Não é o tipo de conteúdo que devia estar aqui." : null,
          snapshot: report.snapshot,
          status: "open",
          createdAt: report.createdAt + (i + 1) * HOURS,
          resolvedAt: null,
        });
      }
    }

    // Reported comments, on the first post of the list.
    const first = postReports[0] ? ctx.db.normalizeId("posts", postReports[0].targetId) : null;
    if (first) {
      const comments = [
        [theo, "Quem escreveu isso claramente não leu o livro, que vergonha."],
        [caio, "Ótimo texto! Só falta o link do meu canal, entra lá."],
        [lu, "Concordo com tudo, principalmente no final."],
      ] as const;
      for (const [index, [author, body]] of comments.entries()) {
        const commentId = await ctx.db.insert("postComments", {
          postId: first,
          authorId: author._id,
          body,
        });
        const reporter = others(author)[index % 4]!;
        await ctx.db.insert("reports", {
          reporterId: reporter._id,
          target: "comment",
          targetId: commentId,
          targetUserId: author._id,
          reason: index === 1 ? "spam" : "harassment",
          details: null,
          snapshot: body,
          status: "open",
          createdAt: now - (12 - index) * HOURS,
          resolvedAt: null,
        });
      }
    }

    // Reported Juntos messages, if a group exists.
    const group = await ctx.db.query("groups").first();
    if (group) {
      const messages = [
        [theo, 34, "Spoiler: o personagem principal morre no capítulo 20."],
        [caio, 12, "Alguém tem o PDF desse livro para me mandar?"],
      ] as const;
      for (const [index, [author, percent, body]] of messages.entries()) {
        const messageId = await ctx.db.insert("groupMessages", {
          groupId: group._id,
          authorId: author._id,
          body,
          percent,
          createdAt: now - (6 - index) * HOURS,
        });
        const reporter = others(author)[index % 4]!;
        await ctx.db.insert("reports", {
          reporterId: reporter._id,
          target: "message",
          targetId: messageId,
          targetUserId: author._id,
          reason: index === 0 ? "spoiler" : "copyright",
          details: null,
          snapshot: body,
          status: "open",
          createdAt: now - (5 - index) * HOURS,
          resolvedAt: null,
        });
      }
    }
    return "Extras de moderação semeados: duplicadas, comentários, mensagens e histórico.";
  },
});
