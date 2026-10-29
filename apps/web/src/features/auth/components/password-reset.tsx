import { requestPasswordReset, resetPassword } from "@grimo/client";
import { Link } from "@tanstack/react-router";
import { type FormEvent, type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { authClient } from "@/lib/auth-client";

/** Centered page for the password screens (no app shell: the reader isn't signed in). */
function Page({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="relative grid min-h-dvh place-items-center bg-surface px-4 py-16">
      <ThemeToggle className="absolute top-5 right-5" />
      <div className="mx-auto w-full max-w-sm">
        <Logo className="mb-6 h-16" />
        <h1 className="text-4xl font-medium italic">{title}</h1>
        <p className="mt-2 mb-8 text-text-muted">{subtitle}</p>
        {children}
        <Link
          to="/login"
          className="mt-8 block text-center font-mono text-[11px] uppercase tracking-wider text-text-muted hover:text-text"
        >
          ← Voltar para entrar
        </Link>
      </div>
    </main>
  );
}

/** "Esqueci minha senha": asks for the email and sends the link (same answer either way). */
export function ForgotPassword() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    setPending(true);
    setError(null);
    const outcome = await requestPasswordReset(
      authClient,
      { email },
      `${window.location.origin}/redefinir-senha`,
    );
    setPending(false);
    if (outcome.status === "error") return setError(outcome.message);
    setSentTo(email.trim());
  }

  if (sentTo) {
    return (
      <Page
        title="Confira seu email"
        subtitle={`Se houver uma conta com ${sentTo}, mandamos um link para criar uma senha nova. Ele vale por 1 hora.`}
      >
        <p className="text-sm text-text-muted">
          Não chegou? Olhe o spam ou peça de novo daqui a pouco.
        </p>
      </Page>
    );
  }
  return (
    <Page title="Esqueceu a senha?" subtitle="Diga seu email e mandamos um link para criar outra.">
      {/* noValidate: the core schemas validate (same rules and messages on web and mobile). */}
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3.5">
        <Input name="email" type="email" placeholder="email@exemplo.com" autoComplete="email" />
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" disabled={pending} className="mt-2 py-3">
          {pending ? "Um instante…" : "Mandar link"}
        </Button>
      </form>
    </Page>
  );
}

/** "Redefinir senha": the page the email link opens (`?token=…`, or `?error=…` when expired). */
export function ResetPassword({ token, error: linkError }: { token?: string; error?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!token || linkError) {
    return (
      <Page
        title="Link expirado"
        subtitle="Esse link de redefinição expirou ou já foi usado. Peça um novo."
      >
        <Link
          to="/esqueci-senha"
          className="bg-accent-gradient block rounded-full px-6 py-3 text-center font-mono text-xs font-medium uppercase tracking-wider text-accent-foreground shadow-md shadow-accent/30 hover:opacity-90"
        >
          Pedir outro link
        </Link>
      </Page>
    );
  }
  if (done) {
    return (
      <Page
        title="Senha nova salva"
        subtitle="Pronto. Por segurança, saímos da sua conta nos outros aparelhos. Entre com a senha nova."
      >
        <Link
          to="/login"
          className="bg-accent-gradient block rounded-full px-6 py-3 text-center font-mono text-xs font-medium uppercase tracking-wider text-accent-foreground shadow-md shadow-accent/30 hover:opacity-90"
        >
          Entrar
        </Link>
      </Page>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const outcome = await resetPassword(
      authClient,
      { password: String(form.get("password")), confirm: String(form.get("confirm")) },
      token!,
    );
    setPending(false);
    if (outcome.status === "error") return setError(outcome.message);
    setDone(true);
  }

  return (
    <Page title="Crie uma senha nova" subtitle="Pelo menos 8 caracteres.">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3.5">
        <Input
          name="password"
          type="password"
          placeholder="Senha nova"
          autoComplete="new-password"
        />
        <Input
          name="confirm"
          type="password"
          placeholder="Repita a senha"
          autoComplete="new-password"
        />
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" disabled={pending} className="mt-2 py-3">
          {pending ? "Um instante…" : "Salvar senha"}
        </Button>
      </form>
    </Page>
  );
}
