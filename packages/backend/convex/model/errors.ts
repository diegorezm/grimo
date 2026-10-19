import { ConvexError } from "convex/values";
import type { z } from "zod";

/**
 * Every expected failure is a `ConvexError` with `{ code, message }` (message in pt-BR, shown in
 * the UI). Clients check the code with `isAppError` from @grimo/client.
 */
export type ErrorCode = "UNAUTHENTICATED" | "NOT_FOUND" | "INVALID" | "FORBIDDEN";

export const appError = (code: ErrorCode, message: string) => new ConvexError({ code, message });

export const unauthenticated = () => appError("UNAUTHENTICATED", "Não autenticado");
export const notFound = (what = "Recurso") => appError("NOT_FOUND", `${what} não encontrado`);

/** Validates with a @grimo/core schema (business rules: ranges, lengths, refinements). */
export function parse<S extends z.ZodType>(schema: S, value: unknown): z.output<S> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw appError("INVALID", result.error.issues[0]?.message ?? "Dados inválidos");
  }
  return result.data;
}
