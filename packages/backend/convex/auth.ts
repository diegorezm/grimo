import { expo } from "@better-auth/expo";
import { type AuthFunctions, createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { betterAuth } from "better-auth/minimal";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { onAccountDeleted } from "./account";
import authConfig from "./auth.config";
import { env } from "./model/env";
import { spendAuthLimit } from "./model/rateLimit";
import { freeUsername } from "./model/readers";

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
      // Account deleted (`/delete-user`): hide the reader now, erase their data in batches.
      onDelete: (ctx, authUser) => onAccountDeleted(ctx, authUser._id),
    },
  },
});

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

const google =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
    : null;

/**
 * Sign in with Apple: required by the App Store when Google sign-in is offered (guideline 4.8).
 * `APPLE_CLIENT_SECRET` is the JWT generated from the Apple key; `APPLE_BUNDLE_ID` lets the iOS
 * app sign in natively.
 */
const apple =
  env.APPLE_CLIENT_ID && env.APPLE_CLIENT_SECRET
    ? {
        clientId: env.APPLE_CLIENT_ID,
        clientSecret: env.APPLE_CLIENT_SECRET,
        appBundleIdentifier: env.APPLE_BUNDLE_ID,
      }
    : null;

/** Which sign-in methods this deployment offers (clients disable the rest). Public. */
export const providers = query({
  args: {},
  handler: () => ({ google: google !== null, apple: apple !== null }),
});

/**
 * Brute force and mass sign-up protection. Sign-in: per email, whoever asks. Sign-up: per
 * client IP when the runtime forwards one, plus a ceiling for all of them. Only HTTP actions can
 * run it (queries and mutations use `createAuth` just to read the session).
 */
async function limitAuthAttempts(
  ctx: GenericCtx<DataModel>,
  hookCtx: { path?: string; body?: unknown; headers?: Headers },
) {
  if (!("runMutation" in ctx)) return;
  const wait = async (name: "signIn" | "signUp" | "signUpAll", key: string) => {
    const retryAfter = await spendAuthLimit(ctx, name, key);
    if (retryAfter === null) return;
    const minutes = Math.max(1, Math.ceil(retryAfter / 60_000));
    throw new APIError("TOO_MANY_REQUESTS", {
      message: `Muitas tentativas. Tente de novo em ${minutes} ${minutes === 1 ? "minuto" : "minutos"}.`,
    });
  };
  if (hookCtx.path === "/sign-in/email") {
    const email = (hookCtx.body as { email?: unknown } | undefined)?.email;
    if (typeof email === "string") await wait("signIn", email.trim().toLowerCase());
  } else if (hookCtx.path === "/sign-up/email") {
    const ip = hookCtx.headers?.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (ip) await wait("signUp", ip);
    await wait("signUpAll", "all");
  }
}

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    // Auth endpoints are served by Convex (convex/http.ts), on the deployment's site URL.
    baseURL: env.CONVEX_SITE_URL,
    // Apple posts its callback from appleid.apple.com.
    trustedOrigins: (request) => [
      ...trustedOrigins(request),
      ...(apple ? ["https://appleid.apple.com"] : []),
    ],
    database: authComponent.adapter(ctx),
    emailAndPassword: { enabled: true, requireEmailVerification: false },
    // Better Auth's own limiter is off: it keys by IP, and where the runtime gives it no client
    // IP it falls back to ONE bucket for everybody. Sign-in and sign-up are limited below.
    rateLimit: { enabled: false },
    hooks: { before: createAuthMiddleware((hookCtx) => limitAuthAttempts(ctx, hookCtx)) },
    // Redirect URIs: <CONVEX_SITE_URL>/api/auth/callback/google (and /apple).
    socialProviders: {
      ...(google ? { google } : {}),
      ...(apple ? { apple } : {}),
    },
    // "Excluir conta" (LGPD art. 18 / App Store 5.1.1(v)): the password, or a session from the
    // last day, confirms it. The `onDelete` trigger above erases the reader's data.
    user: { deleteUser: { enabled: true } },
    plugins: [
      // Mobile: session cookie in SecureStore, sent as a header.
      expo(),
      // Web: the SPA is on another domain, so the cookie travels in a header (localStorage).
      crossDomain({ siteUrl }),
      // Issues the JWT that the Convex client uses (convex/auth.config.ts).
      convex({ authConfig }),
    ],
  });
