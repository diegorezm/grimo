import { z } from "zod";
import { GENRES } from "../books/genres";
import { isValidTimeZone } from "../lib/date";

export const USERNAME_REGEX = /^[a-z0-9_.]{3,30}$/;

/**
 * A valid username from a display name: "Ana Júlia Prado" → "ana.julia.prado". Used to prefill
 * sign-up and to name accounts created with Google (which have no username). May still need a
 * suffix to be unique.
 */
export function usernameFromName(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9_.]/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/^\.|\.$/g, "")
    .slice(0, 24);
  return base.length >= 3 ? base : `leitor${base ? `.${base}` : ""}`;
}

/** Onboarding: the name and @ a new reader shows to others. */
export const setupProfileSchema = z.object({
  name: z.string().trim().min(1, "Conta pra gente o seu nome").max(80),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(USERNAME_REGEX, "Use 3 a 30 letras minúsculas, números, ponto ou _"),
});
export type SetupProfileInput = z.infer<typeof setupProfileSchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  bio: z.string().trim().max(280).nullable().optional(),
  favoriteGenres: z.array(z.enum(GENRES)).max(5).optional(),
  /** Reading goal (number of books) for the current year. */
  yearlyGoal: z.number().int().min(1).max(1000).nullable().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** The IANA time zone an app reports for its reader (`America/Sao_Paulo`). */
export const timeZoneSchema = z
  .string()
  .trim()
  .max(64)
  .refine(isValidTimeZone, "Fuso horário inválido");
