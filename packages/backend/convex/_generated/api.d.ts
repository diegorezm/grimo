/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as books from "../books.js";
import type * as feed from "../feed.js";
import type * as http from "../http.js";
import type * as model_content from "../model/content.js";
import type * as model_env from "../model/env.js";
import type * as model_errors from "../model/errors.js";
import type * as model_limits from "../model/limits.js";
import type * as model_openLibrary from "../model/openLibrary.js";
import type * as model_readers from "../model/readers.js";
import type * as model_seedData from "../model/seedData.js";
import type * as model_shelves from "../model/shelves.js";
import type * as model_stats from "../model/stats.js";
import type * as posts from "../posts.js";
import type * as seed from "../seed.js";
import type * as shelves from "../shelves.js";
import type * as stats from "../stats.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  books: typeof books;
  feed: typeof feed;
  http: typeof http;
  "model/content": typeof model_content;
  "model/env": typeof model_env;
  "model/errors": typeof model_errors;
  "model/limits": typeof model_limits;
  "model/openLibrary": typeof model_openLibrary;
  "model/readers": typeof model_readers;
  "model/seedData": typeof model_seedData;
  "model/shelves": typeof model_shelves;
  "model/stats": typeof model_stats;
  posts: typeof posts;
  seed: typeof seed;
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
};
