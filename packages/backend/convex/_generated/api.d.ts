/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as account from "../account.js";
import type * as auth from "../auth.js";
import type * as books from "../books.js";
import type * as crons from "../crons.js";
import type * as email from "../email.js";
import type * as feed from "../feed.js";
import type * as groups from "../groups.js";
import type * as http from "../http.js";
import type * as imports from "../imports.js";
import type * as legal from "../legal.js";
import type * as lists from "../lists.js";
import type * as migrations from "../migrations.js";
import type * as model_bookStats from "../model/bookStats.js";
import type * as model_content from "../model/content.js";
import type * as model_email from "../model/email.js";
import type * as model_env from "../model/env.js";
import type * as model_errors from "../model/errors.js";
import type * as model_friends from "../model/friends.js";
import type * as model_groups from "../model/groups.js";
import type * as model_legal from "../model/legal.js";
import type * as model_limits from "../model/limits.js";
import type * as model_lists from "../model/lists.js";
import type * as model_moderation from "../model/moderation.js";
import type * as model_notifications from "../model/notifications.js";
import type * as model_openLibrary from "../model/openLibrary.js";
import type * as model_rateLimit from "../model/rateLimit.js";
import type * as model_readers from "../model/readers.js";
import type * as model_safety from "../model/safety.js";
import type * as model_seedData from "../model/seedData.js";
import type * as model_shelves from "../model/shelves.js";
import type * as model_stats from "../model/stats.js";
import type * as moderation from "../moderation.js";
import type * as moderators from "../moderators.js";
import type * as notifications from "../notifications.js";
import type * as posts from "../posts.js";
import type * as seed from "../seed.js";
import type * as sessions from "../sessions.js";
import type * as shelves from "../shelves.js";
import type * as stats from "../stats.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  account: typeof account;
  auth: typeof auth;
  books: typeof books;
  crons: typeof crons;
  email: typeof email;
  feed: typeof feed;
  groups: typeof groups;
  http: typeof http;
  imports: typeof imports;
  legal: typeof legal;
  lists: typeof lists;
  migrations: typeof migrations;
  "model/bookStats": typeof model_bookStats;
  "model/content": typeof model_content;
  "model/email": typeof model_email;
  "model/env": typeof model_env;
  "model/errors": typeof model_errors;
  "model/friends": typeof model_friends;
  "model/groups": typeof model_groups;
  "model/legal": typeof model_legal;
  "model/limits": typeof model_limits;
  "model/lists": typeof model_lists;
  "model/moderation": typeof model_moderation;
  "model/notifications": typeof model_notifications;
  "model/openLibrary": typeof model_openLibrary;
  "model/rateLimit": typeof model_rateLimit;
  "model/readers": typeof model_readers;
  "model/safety": typeof model_safety;
  "model/seedData": typeof model_seedData;
  "model/shelves": typeof model_shelves;
  "model/stats": typeof model_stats;
  moderation: typeof moderation;
  moderators: typeof moderators;
  notifications: typeof notifications;
  posts: typeof posts;
  seed: typeof seed;
  sessions: typeof sessions;
  shelves: typeof shelves;
  stats: typeof stats;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
  migrations: import("@convex-dev/migrations/_generated/component.js").ComponentApi<"migrations">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
