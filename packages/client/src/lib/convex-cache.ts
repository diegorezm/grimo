import {
  type Query,
  type QueryClient,
  type QueryFunctionContext,
  queryOptions,
} from "@tanstack/react-query";
import type { ConvexReactClient, Watch } from "convex/react";
import {
  type FunctionArgs,
  type FunctionReference,
  type FunctionReturnType,
  getFunctionName,
  makeFunctionReference,
} from "convex/server";
import { ConvexError } from "convex/values";

/**
 * Convex ↔ TanStack Query bridge. TanStack Query owns the cache (persisted to disk, rendered
 * instantly on cold start, patched by optimistic updates); Convex subscriptions keep whatever is
 * on screen live by writing their results into it.
 *
 * Why not `@convex-dev/react-query`'s ConvexQueryClient: it subscribes to every query in the
 * cache, including the whole persisted cache on restore (days of book pages), and before auth is
 * ready (so signed-in queries briefly fail). Here a query is subscribed only while a component
 * uses it (plus `lingerMs`), and only once its auth requirement is met.
 */

/**
 * - `required`: signed-in reader only. Waits for Convex auth; never runs signed out.
 * - `optional`: public, but personalized when signed in (`likedByMe`, `isFollowing`). Waits
 *   until auth is settled so a cached signed-in result is never replaced by a signed-out one.
 */
export type QueryAuth = "required" | "optional";

/** Where Convex auth stands (from `useConvexAuth`, synced by `<ConvexAuthSync>`). */
export type AuthState = "pending" | "signed-in" | "signed-out";

export const CONVEX_QUERY = "convexQuery";

type ConvexKey = readonly [typeof CONVEX_QUERY, string, Record<string, unknown>];

const isConvexKey = (key: readonly unknown[]): key is ConvexKey => key[0] === CONVEX_QUERY;

/**
 * Query options for a Convex query: `["convexQuery", "shelves:list", args]`. Never stale for
 * TanStack (the subscription keeps it fresh); spread more options on top when needed.
 */
export function convexQuery<F extends FunctionReference<"query">>(
  fn: F,
  args: FunctionArgs<F>,
  auth: QueryAuth,
) {
  return queryOptions<FunctionReturnType<F>>({
    queryKey: [CONVEX_QUERY, getFunctionName(fn), args],
    staleTime: Number.POSITIVE_INFINITY,
    meta: { auth },
  });
}

/** Prefix that matches every cached instance of a Convex query (any args). */
export const convexQueryPrefix = (fn: FunctionReference<"query">) =>
  [CONVEX_QUERY, getFunctionName(fn)] as const;

/** A Convex function error (`ConvexError({ code, message })` thrown by convex/model/errors.ts). */
export function appErrorCode(error: unknown): string | null {
  if (!(error instanceof ConvexError)) return null;
  const data = error.data as { code?: unknown } | null;
  return typeof data?.code === "string" ? data.code : null;
}

export const isUnauthorized = (error: unknown) => appErrorCode(error) === "UNAUTHENTICATED";

/** The pt-BR message to show for any error. */
export function errorMessage(error: unknown, fallback = "Algo deu errado"): string {
  if (error instanceof ConvexError) {
    const data = error.data as { message?: unknown } | null;
    if (typeof data?.message === "string") return data.message;
  }
  return fallback;
}

interface Subscription {
  queryKey: ConvexKey;
  watch: Watch<unknown>;
  unsubscribe: () => void;
  linger?: ReturnType<typeof setTimeout>;
}

export interface ConvexCacheOptions {
  /** Keep a subscription this long after the last component using it unmounts. */
  lingerMs?: number;
  /** A signed-in query failed with UNAUTHENTICATED (session revoked/expired): sign out. */
  onUnauthorized?: () => void;
}

export class ConvexCache {
  private readonly subscriptions = new Map<string, Subscription>();
  private auth: AuthState = "pending";
  private waiters: (() => void)[] = [];
  private queryClient: QueryClient | null = null;
  private readonly lingerMs: number;

  constructor(
    readonly convex: ConvexReactClient,
    private readonly options: ConvexCacheOptions = {},
  ) {
    this.lingerMs = options.lingerMs ?? 60_000;
  }

  /** Default `queryFn` for Convex keys: a one-off read, once auth allows it. */
  queryFn = async (context: QueryFunctionContext): Promise<unknown> => {
    if (!isConvexKey(context.queryKey)) {
      throw new Error(`No queryFn for ${JSON.stringify(context.queryKey)}`);
    }
    await this.ready(context.meta?.auth as QueryAuth | undefined);
    const [, name, args] = context.queryKey;
    return this.convex.query(makeFunctionReference<"query">(name), args);
  };

  /** Starts listening to the query cache (and to mutations, see `onMutationsSettled`). */
  connect(queryClient: QueryClient) {
    this.queryClient = queryClient;
    const stopQueries = queryClient.getQueryCache().subscribe((event) => {
      if (!isConvexKey(event.query.queryKey)) return;
      if (event.type === "removed") this.drop(event.query.queryHash);
      else if (
        event.type === "added" ||
        event.type === "observerAdded" ||
        event.type === "observerRemoved" ||
        event.type === "observerOptionsUpdated"
      ) {
        this.sync(event.query);
      }
    });
    const stopMutations = queryClient.getMutationCache().subscribe((event) => {
      if (event.type === "updated" && queryClient.isMutating() === 0) this.flush();
    });
    return () => {
      stopQueries();
      stopMutations();
      for (const hash of [...this.subscriptions.keys()]) this.drop(hash);
    };
  }

  /** Drops every subscription (sign-in/sign-out): nothing from the old session writes back. */
  reset() {
    for (const hash of [...this.subscriptions.keys()]) this.drop(hash);
  }

  setAuth(auth: AuthState) {
    if (auth === this.auth) return;
    this.auth = auth;
    if (auth !== "pending") {
      for (const wake of this.waiters.splice(0)) wake();
    }
    for (const query of this.queryClient?.getQueryCache().getAll() ?? []) {
      if (isConvexKey(query.queryKey)) this.sync(query);
    }
  }

  private allows(auth: QueryAuth | undefined) {
    if (auth === "required") return this.auth === "signed-in";
    if (auth === "optional") return this.auth !== "pending";
    return true;
  }

  /** Resolves once `auth` allows running the query (signed-in queries wait to be signed in). */
  private async ready(auth: QueryAuth | undefined) {
    while (!this.allows(auth)) {
      await new Promise<void>((resolve) => this.waiters.push(resolve));
    }
  }

  /** Subscribed while some enabled observer uses it and auth allows it. */
  private sync(query: Query) {
    const wanted = query.isActive() && this.allows(query.meta?.auth as QueryAuth | undefined);
    const current = this.subscriptions.get(query.queryHash);
    if (wanted) {
      if (current?.linger) {
        clearTimeout(current.linger);
        current.linger = undefined;
      }
      if (!current) this.subscribe(query);
    } else if (current && !current.linger) {
      const lingerMs = this.allows(query.meta?.auth as QueryAuth | undefined) ? this.lingerMs : 0;
      current.linger = setTimeout(() => this.drop(query.queryHash), lingerMs);
    }
  }

  private subscribe(query: Query) {
    const queryKey = query.queryKey as unknown as ConvexKey;
    const [, name, args] = queryKey;
    const watch = this.convex.watchQuery(makeFunctionReference<"query">(name), args);
    const unsubscribe = watch.onUpdate(() => this.apply(query.queryHash));
    this.subscriptions.set(query.queryHash, { queryKey, watch, unsubscribe });
    this.apply(query.queryHash);
  }

  private drop(hash: string) {
    const subscription = this.subscriptions.get(hash);
    if (!subscription) return;
    clearTimeout(subscription.linger);
    subscription.unsubscribe();
    this.subscriptions.delete(hash);
  }

  /** Writes the subscription's latest result into the cache. */
  private apply(hash: string) {
    const queryClient = this.queryClient;
    const subscription = this.subscriptions.get(hash);
    if (!queryClient || !subscription) return;
    // An optimistic update is on screen: server results land once mutations settle (`flush`),
    // so a result computed before the mutation never flickers the old value back.
    if (queryClient.isMutating() > 0) return;
    const query = queryClient.getQueryCache().get(hash);
    if (!query) return;

    let value: unknown;
    try {
      value = subscription.watch.localQueryResult();
    } catch (error) {
      if (isUnauthorized(error)) this.options.onUnauthorized?.();
      query.setState({
        error: error as Error,
        errorUpdateCount: query.state.errorUpdateCount + 1,
        errorUpdatedAt: Date.now(),
        fetchFailureCount: query.state.fetchFailureCount + 1,
        fetchFailureReason: error as Error,
        fetchStatus: "idle",
        status: "error",
      });
      return;
    }
    if (value !== undefined) queryClient.setQueryData(subscription.queryKey, value);
  }

  private flush() {
    for (const hash of this.subscriptions.keys()) this.apply(hash);
  }
}
