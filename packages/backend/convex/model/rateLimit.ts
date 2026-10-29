import { DAY, HOUR, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import type { GenericActionCtx, GenericMutationCtx } from "convex/server";
import { components } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import { appError } from "./errors";

/**
 * Limits on what costs us something (rows others see, calls to Open Library), per reader; plus
 * sign-in and sign-up, which `auth.ts` limits through a Better Auth hook. Generous for a human,
 * tight for a script.
 */
export const rateLimiter = new RateLimiter(components.rateLimiter, {
  createPost: { kind: "fixed window", rate: 10, period: HOUR },
  createComment: { kind: "fixed window", rate: 30, period: HOUR },
  report: { kind: "fixed window", rate: 10, period: DAY },
  createGroup: { kind: "fixed window", rate: 10, period: DAY },
  groupMessage: { kind: "fixed window", rate: 60, period: HOUR },
  // Each new book makes a request to Open Library (`books.refreshBook`).
  addToShelf: { kind: "fixed window", rate: 120, period: HOUR },
  // Open Library lookups made on a reader's behalf.
  bookSearch: { kind: "fixed window", rate: 60, period: MINUTE },
  loadWork: { kind: "fixed window", rate: 60, period: MINUTE },
  // Sign-in (key: the email) and sign-up (key: the caller's IP, plus a ceiling for everyone),
  // enforced in Better Auth's before-hook (auth.ts).
  signIn: { kind: "fixed window", rate: 10, period: 15 * MINUTE },
  signUp: { kind: "fixed window", rate: 5, period: HOUR },
  signUpAll: { kind: "fixed window", rate: 300, period: HOUR },
});

type Name =
  | "createPost"
  | "createComment"
  | "report"
  | "createGroup"
  | "groupMessage"
  | "addToShelf"
  | "bookSearch"
  | "loadWork";

type AuthName = "signIn" | "signUp" | "signUpAll";

/** Spends one use of an auth limit: null when allowed, else the milliseconds to wait. */
export async function spendAuthLimit(
  ctx: Parameters<typeof rateLimiter.limit>[0],
  name: AuthName,
  key: string,
): Promise<number | null> {
  const { ok, retryAfter } = await rateLimiter.limit(ctx, name, { key });
  return ok ? null : (retryAfter ?? MINUTE);
}

/** Spends one use of `name` for `key` (the reader), or fails with a message saying to wait. */
export async function enforceRateLimit(
  ctx: GenericMutationCtx<DataModel> | GenericActionCtx<DataModel>,
  name: Name,
  key: string,
) {
  const { ok, retryAfter } = await rateLimiter.limit(ctx, name, { key });
  if (ok) return;
  const minutes = Math.max(1, Math.ceil((retryAfter ?? MINUTE) / MINUTE));
  throw appError(
    "RATE_LIMITED",
    `Calma aí: você fez isso muitas vezes. Tente de novo em ${minutes} ${minutes === 1 ? "minuto" : "minutos"}.`,
  );
}
