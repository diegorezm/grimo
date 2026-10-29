import { useMe } from "@grimo/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

/**
 * Shown while the reader's email is not verified: comment, post, like and follow stay locked
 * (`me.needsEmailVerification`). Offers to send the link again.
 */
export function VerifyEmailBanner() {
  const needs = useMe().data?.needsEmailVerification ?? false;
  const email = authClient.useSession().data?.user.email;
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  if (!needs || !email) return null;

  async function resend() {
    setState("sending");
    const { error } = await authClient.sendVerificationEmail({
      email: email as string,
      callbackURL: `${window.location.origin}/`,
    });
    setState(error ? "error" : "sent");
  }

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-surface-muted px-4 py-3 text-sm lg:px-8"
    >
      <p className="min-w-0 flex-1">
        <strong>Confirme seu email.</strong> Enviamos um link para{" "}
        <span className="break-all">{email}</span>. Até lá você não pode comentar, curtir nem seguir
        leitores.
      </p>
      {state === "sent" ? (
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
          Link enviado
        </span>
      ) : (
        <Button variant="secondary" disabled={state === "sending"} onClick={() => void resend()}>
          {state === "sending"
            ? "Enviando…"
            : state === "error"
              ? "Tentar de novo"
              : "Reenviar link"}
        </Button>
      )}
    </div>
  );
}
