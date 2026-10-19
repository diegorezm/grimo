import { z } from "zod";

/** New accounts need at least this many characters (Better Auth's default minimum). */
export const MIN_PASSWORD_LENGTH = 8;

/** The single sign-in / sign-up form: email and password. */
export const emailCredentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Esse email não parece válido")),
  password: z.string().min(1, "Digite sua senha"),
});
export type EmailCredentials = z.infer<typeof emailCredentialsSchema>;

/** Extra rule when the credentials end up creating an account. */
export const newPasswordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `A senha precisa de pelo menos ${MIN_PASSWORD_LENGTH} caracteres`);

/** The first problem of a failed parse, ready to show (pt-BR). */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Dados inválidos";
}
