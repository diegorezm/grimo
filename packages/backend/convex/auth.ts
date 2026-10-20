import { expo } from "@better-auth/expo";
import { type AuthFunctions, createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";
import { env } from "./model/env";
import { freeUsername } from "./model/readers";

const siteUrl = env.SITE_URL;
/** The mobile app's scheme (Expo deep links, `expo-origin` header). */
const MOBILE_SCHEME = "grimo://";

/** `http://localhost:<any port>` or `http://127.0.0.1:<any port>`. */
const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/** Expo Go identifies the app as `exp://<LAN IP>:<port>` instead of the app scheme. */
const EXPO_GO_ORIGIN = /^exp:\/\/[\w.-]+(:\d+)?$/;

/**
 * Origins allowed to call auth (and CORS). In local dev (SITE_URL on localhost) any localhost
 * port is accepted too, so the web app works whichever port Vite picks, and so is Expo Go.
 */
function trustedOrigins(request?: Request) {
  const origins = [siteUrl, MOBILE_SCHEME];
  const origin = request?.headers.get("origin") ?? request?.headers.get("expo-origin");
  const dev = LOCAL_ORIGIN.test(siteUrl);
  if (dev && origin && (LOCAL_ORIGIN.test(origin) || EXPO_GO_ORIGIN.test(origin))) {
    origins.push(origin);
  }
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
        // Email sign-up has no name yet; Google brings the provider's. The reader confirms both
        // (and picks the @) in the onboarding, so this @ is only a placeholder from the name
        // (never from the private email).
        const name = authUser.name.trim();
        const handle = await freeUsername(ctx, name);
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
          setupDone: false,
        });
      },
      onUpdate: async (ctx, authUser) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_authId", (q) => q.eq("authId", authUser._id))
          .unique();
        if (!user) return;
        // Name and @ belong to the reader (users.completeSetup / updateMe); auth only owns the image.
        await ctx.db.patch(user._id, { image: authUser.image ?? null });
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

const google =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
    : null;

/** Which sign-in methods this deployment offers (clients disable the rest). Public. */
export const providers = query({
  args: {},
  handler: () => ({ google: google !== null }),
});

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    // Auth endpoints are served by Convex (convex/http.ts), on the deployment's site URL.
    baseURL: env.CONVEX_SITE_URL,
    trustedOrigins,
    database: authComponent.adapter(ctx),
    emailAndPassword: { enabled: true, requireEmailVerification: false },
    // Redirect URI to register in Google Cloud: <CONVEX_SITE_URL>/api/auth/callback/google
    socialProviders: google ? { google } : {},
    plugins: [
      // Mobile: session cookie in SecureStore, sent as a header.
      expo(),
      // Web: the SPA is on another domain, so the cookie travels in a header (localStorage).
      crossDomain({ siteUrl }),
      // Issues the JWT that the Convex client uses (convex/auth.config.ts).
      convex({ authConfig }),
    ],
  });
