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
        const handle = (authUser.username ?? authUser.email.split("@")[0] ?? "").toLowerCase();
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
        const handle = (authUser.username ?? user.username).toLowerCase();
        await ctx.db.patch(user._id, {
          name: authUser.name,
          username: handle,
          image: authUser.image ?? null,
          searchText: `${authUser.name} ${handle}`,
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
    trustedOrigins: [siteUrl, MOBILE_SCHEME],
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
