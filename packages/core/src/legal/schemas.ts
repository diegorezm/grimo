import { z } from "zod";
import { MIN_AGE, parseBirthDate } from "./age";

/** Birth date from the onboarding (`YYYY-MM-DD`). Only "is 16+" is stored, never the date. */
export const birthDateSchema = z
  .string({ error: "Informe sua data de nascimento" })
  .trim()
  .min(1, "Informe sua data de nascimento")
  .refine((value) => parseBirthDate(value) !== null, "Essa data não parece válida")
  .refine((value) => Number(value.slice(0, 4)) >= 1900, "Essa data não parece válida");

/**
 * Agreeing to the Terms and the Privacy Policy: the versions the reader saw (the server checks
 * they are the current ones) and, when the age isn't confirmed yet, the birth date.
 */
export const legalAcceptanceSchema = z.object({
  accepted: z.literal(true, { error: "Para continuar, aceite os Termos e a Política" }),
  termsVersion: z.string().min(1),
  privacyVersion: z.string().min(1),
  birthDate: birthDateSchema.optional(),
});
export type LegalAcceptanceInput = z.infer<typeof legalAcceptanceSchema>;

export const UNDERAGE_MESSAGE = `O Grimo é para leitores a partir de ${MIN_AGE} anos.`;

/** Account deletion: the reader types their @ to confirm. */
export function deleteConfirmationMatches(typed: string, username: string) {
  return typed.trim().replace(/^@/, "").toLowerCase() === username.toLowerCase();
}
