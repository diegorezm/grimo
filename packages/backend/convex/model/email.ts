import type { GenericActionCtx, GenericMutationCtx } from "convex/server";
import { internal } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Hands the message to `email.send` through the scheduler, so the HTTP request that triggered
 * it (sign-up, "forgot password") answers right away and never reveals, by how long it takes,
 * whether the email has an account. A query context can't schedule: nothing is sent.
 */
export async function sendEmail(ctx: unknown, message: EmailMessage) {
  const { scheduler } = ctx as Partial<GenericActionCtx<DataModel> | GenericMutationCtx<DataModel>>;
  if (!scheduler) return;
  await scheduler.runAfter(0, internal.email.send, message);
}

/**
 * Better Auth's links come back to its own endpoint and then redirect to `callbackURL`. When the
 * client gave none (or a relative one, which would resolve against the auth host), send the
 * reader to `path` on the web app.
 */
export function withCallback(url: string, siteUrl: string, path: string) {
  const link = new URL(url);
  const callback = link.searchParams.get("callbackURL");
  if (!callback || callback.startsWith("/")) {
    link.searchParams.set("callbackURL", `${siteUrl}${callback || path}`);
  }
  return link.toString();
}

const layout = (title: string, body: string, link: string, button: string) => ({
  html: `<div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:24px;color:#222">
<h1 style="font-weight:500;font-style:italic">${title}</h1>
<p>${body}</p>
<p><a href="${link}" style="display:inline-block;background:#6b7a3a;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none">${button}</a></p>
<p style="color:#777;font-size:13px">Se o botão não abrir, copie este endereço no navegador:<br>${link}</p>
<p style="color:#777;font-size:13px">Se não foi você, é só ignorar este email.</p></div>`,
  text: `${title}\n\n${body}\n\n${link}\n\nSe não foi você, é só ignorar este email.`,
});

export const verifyEmail = (link: string) => ({
  subject: "Confirme seu email no Grimo",
  ...layout(
    "Confirme seu email",
    "Falta só um passo para comentar, curtir e seguir leitores: confirmar que este email é seu.",
    link,
    "Confirmar email",
  ),
});

export const resetPasswordEmail = (link: string) => ({
  subject: "Redefinir sua senha do Grimo",
  ...layout(
    "Redefinir senha",
    "Pediram para redefinir a senha da sua conta. O link vale por 1 hora.",
    link,
    "Criar nova senha",
  ),
});
