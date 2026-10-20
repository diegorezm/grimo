/**
 * Auth pieces shared by web and mobile. Each app creates its own `authClient` with these plugins
 * plus its platform's (web: `crossDomainClient`, mobile: `expoClient`), pointed at the Convex
 * site URL (`CONVEX_SITE_URL`, where convex/http.ts serves /api/auth).
 */
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { emailCredentialsSchema, firstIssue, newPasswordSchema } from "@grimo/core";

/** Plugins every client must register so types/endpoints match the server (convex/auth.ts). */
export const sharedAuthClientPlugins = () => [convexClient()];

/**
 * `https://x.convex.cloud` → `https://x.convex.site` (HTTP actions, where auth lives).
 * Local dev deployments use the next port (3210 → 3211).
 */
export function convexSiteUrl(convexUrl: string) {
  const url = new URL(convexUrl);
  if (url.hostname.endsWith(".convex.cloud")) {
    url.hostname = url.hostname.replace(/\.convex\.cloud$/, ".convex.site");
  } else if (url.port) {
    url.port = String(Number(url.port) + 1);
  }
  return url.origin;
}

/** Better Auth error → message for the sign-in / sign-up forms (pt-BR). */
export function authErrorMessage(error: { code?: string; message?: string }) {
  switch (error.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "Email ou senha incorretos.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "Já existe uma conta com esse email. Entre com ela.";
    case "PASSWORD_TOO_SHORT":
      return "A senha precisa de pelo menos 8 caracteres.";
    case "INVALID_EMAIL":
      return "Esse email não parece válido.";
    default:
      return "Não foi possível entrar agora. Tente de novo.";
  }
}

type AuthResult = Promise<{ error: { code?: string; message?: string } | null }>;

/** The part of a Better Auth client that `continueWithEmail` needs. */
export interface EmailAuthClient {
  signIn: { email: (input: { email: string; password: string }) => AuthResult };
  signUp: { email: (input: { email: string; password: string; name: string }) => AuthResult };
}

export type EmailAuthOutcome =
  | { status: "signed-in" }
  /** A new account: send the reader to the onboarding (name and @). */
  | { status: "signed-up" }
  | { status: "error"; message: string };

/**
 * One form for both: tries to sign in and, when that email + password isn't an account, creates
 * one. Better Auth never says whether an email exists (on purpose), so a failed sign-in is
 * followed by a sign-up: if the email is taken, the password was wrong.
 * Input is validated with the core schemas first (`emailCredentialsSchema`, `newPasswordSchema`).
 */
export async function continueWithEmail(
  client: EmailAuthClient,
  input: { email: string; password: string },
): Promise<EmailAuthOutcome> {
  const fail = (message: string) => ({ status: "error", message }) as const;
  const credentials = emailCredentialsSchema.safeParse(input);
  if (!credentials.success) return fail(firstIssue(credentials.error));
  const { email, password } = credentials.data;

  const signIn = await client.signIn.email({ email, password });
  if (!signIn.error) return { status: "signed-in" };
  if (signIn.error.code !== "INVALID_EMAIL_OR_PASSWORD")
    return fail(authErrorMessage(signIn.error));

  const newPassword = newPasswordSchema.safeParse(password);
  if (!newPassword.success) {
    return fail(`Email ou senha incorretos. Se a conta é nova: ${firstIssue(newPassword.error)}.`);
  }
  // The name comes in the onboarding (Google accounts bring the provider's).
  const signUp = await client.signUp.email({ email, password, name: "" });
  if (!signUp.error) return { status: "signed-up" };
  if (signUp.error.code?.startsWith("USER_ALREADY_EXISTS")) {
    return fail("Senha incorreta para esse email.");
  }
  return fail(authErrorMessage(signUp.error));
}

/** The part of a Better Auth client that account deletion needs. */
export interface DeleteAccountClient {
  deleteUser: (input: { password?: string }) => AuthResult;
}

export type DeleteAccountOutcome = { status: "deleted" } | { status: "error"; message: string };

/**
 * Deletes the signed-in account (Better Auth `/delete-user`; the backend then erases the
 * reader's data). Email accounts confirm with the password; Google/Apple accounts need a recent
 * sign-in (last 24 h), otherwise they are asked to sign in again.
 */
export async function deleteAccount(
  client: DeleteAccountClient,
  password?: string,
): Promise<DeleteAccountOutcome> {
  const { error } = await client.deleteUser(password ? { password } : {});
  if (!error) return { status: "deleted" };
  switch (error.code) {
    case "INVALID_PASSWORD":
      return { status: "error", message: "Senha incorreta." };
    case "SESSION_EXPIRED":
      return {
        status: "error",
        message: "Por segurança, saia e entre de novo para excluir a conta.",
      };
    default:
      return { status: "error", message: "Não foi possível excluir a conta agora. Tente de novo." };
  }
}
