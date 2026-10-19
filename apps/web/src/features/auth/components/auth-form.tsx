import { continueWithEmail } from "@grimo/client";
import { useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { clearCacheForSignIn } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { GoogleButton } from "./google-button";

/**
 * Sign in and sign up are the same form: email + password (or Google). An email that isn't an
 * account yet becomes one, and the onboarding asks for name and @. Returning readers go to
 * `redirectTo`.
 */
export function AuthForm({ redirectTo = "/" }: { redirectTo?: string }) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const outcome = await continueWithEmail(authClient, {
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    if (outcome.status === "error") {
      setPending(false);
      return setError(outcome.message);
    }
    // New session: start from an empty cache so nothing from a previous account shows up.
    await clearCacheForSignIn();
    await navigate({ to: outcome.status === "signed-up" ? "/onboarding" : redirectTo });
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <Logo className="mb-6 h-16" />
      <h1 className="text-4xl font-medium italic">Bora ler?</h1>
      <p className="mt-2 mb-8 text-text-muted">
        Entre com seu email. Se ainda não tiver conta, a gente cria na hora.
      </p>

      <GoogleButton redirectTo={redirectTo} />

      <div className="my-6 flex items-center gap-3 font-mono text-[11px] uppercase tracking-wider text-text-muted">
        <span className="h-px flex-1 bg-border" />
        ou com email
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* noValidate: the core schemas validate (same rules and messages on web and mobile). */}
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3.5">
        <Input name="email" type="email" placeholder="email@exemplo.com" autoComplete="email" />
        <Input
          name="password"
          type="password"
          placeholder="Senha (8+ caracteres se a conta for nova)"
          autoComplete="current-password"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={pending} className="mt-2 py-3">
          {pending ? "Um instante…" : "Continuar"}
        </Button>
        <p className="text-center font-mono text-[11px] text-text-muted">
          É de graça. Seu email nunca aparece no perfil.
        </p>
      </form>
    </div>
  );
}
