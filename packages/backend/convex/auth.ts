import { expo } from "@better-auth/expo";
import { type AuthFunctions, createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { username } from "better-auth/plugins/username";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";
import { env } from "./model/env";

const siteUrl = env.SITE_URL;
/** The mobile app's scheme (Expo deep links, `expo-origin` header). */
const MOBILE_SCHEME = "grimo://";

/** `http://localhost:<any port>` or `http://127.0.0.1:<any port>`. */
const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/**
 * Origins allowed to call auth (and CORS). In local dev (SITE_URL on localhost) any localhost
 * port is accepted too, so the web app works whichever port Vite picks.
 */
function trustedOrigins(request?: Request) {
  const origins = [siteUrl, MOBILE_SCHEME];
  const origin = request?.headers.get("origin");
  if (LOCAL_ORIGIN.test(siteUrl) && origin && LOCAL_ORIGIN.test(origin)) origins.push(origin);
  return origins;
}

const authFunctions: AuthFunctions = internal.auth;

/**
 * Better Auth runs inside Convex as a component (its own tables: user, session, account…).
 * The triggers keep our `users` table (the reader) in sync with Better Auth's `user`.
 */
export const authComponent = createClient<DataModel>(components.betterAuth, {
  authFunctions,
  triggers: {
    user: {
      onCreate: async (ctx, authUser) => {
        const name = authUser.name;
        // The username plugin guarantees uniqueness; without one, make up a free handle
        // (never derived from the email, which is private).
        let handle = authUser.username?.toLowerCase() ?? "";
        while (
          !handle ||
          (await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", handle))
            .first())
        ) {
          handle = `leitor_${Math.random().toString(36).slice(2, 8)}`;
        }
        await ctx.db.insert("users", {
          authId: authUser._id,
          name,
          username: handle,
          image: authUser.image ?? null,
          bio: null,
          favoriteGenres: [],
          followers: 0,
          following: 0,
          bookCount: 0,
          searchText: `${name} ${handle}`,
        });
      },
      onUpdate: async (ctx, authUser) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_authId", (q) => q.eq("authId", authUser._id))
          .unique();
        if (!user) return;
        // The name is the reader's (edited via users.updateMe); auth only owns handle and image.
        const handle = (authUser.username ?? user.username).toLowerCase();
        await ctx.db.patch(user._id, {
          username: handle,
          image: authUser.image ?? null,
          searchText: `${user.name} ${handle}`,
        });
      },
      onDelete: async (ctx, authUser) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_authId", (q) => q.eq("authId", authUser._id))
          .unique();
        if (user) await ctx.db.delete(user._id);
      },
    },
  },
});

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    // Auth endpoints are served by Convex (convex/http.ts), on the deployment's site URL.
    baseURL: env.CONVEX_SITE_URL,
    trustedOrigins,
    database: authComponent.adapter(ctx),
    emailAndPassword: { enabled: true, requireEmailVerification: false },
    plugins: [
      username(),
      // Mobile: session cookie in SecureStore, sent as a header.
      expo(),
      // Web: the SPA is on another domain, so the cookie travels in a header (localStorage).
      crossDomain({ siteUrl }),
      // Issues the JWT that the Convex client uses (convex/auth.config.ts).
      convex({ authConfig }),
    ],
  });
