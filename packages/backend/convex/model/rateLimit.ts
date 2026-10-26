import { DAY, HOUR, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import type { GenericActionCtx, GenericMutationCtx } from "convex/server";
import { components } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import { appError } from "./errors";

/**
 * Per-reader limits on what costs us something (rows others see, calls to Open Library). Sign-in
 * and sign-up are limited by Better Auth itself (`rateLimit` in `auth.ts`). Generous for a human,
 * tight for a script.
 */
export const rateLimiter = new RateLimiter(components.rateLimiter, {
  createPost: { kind: "fixed window", rate: 10, period: HOUR },
  createComment: { kind: "fixed window", rate: 30, period: HOUR },
  report: { kind: "fixed window", rate: 10, period: DAY },
  // Each new book makes a request to Open Library (`books.refreshBook`).
  addToShelf: { kind: "fixed window", rate: 120, period: HOUR },
  // Open Library lookups made on a reader's behalf.
  bookSearch: { kind: "fixed window", rate: 60, period: MINUTE },
  loadWork: { kind: "fixed window", rate: 60, period: MINUTE },
});

type Name = "createPost" | "createComment" | "report" | "addToShelf" | "bookSearch" | "loadWork";

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
