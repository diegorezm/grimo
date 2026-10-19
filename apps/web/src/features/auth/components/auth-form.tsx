import { useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { clearCache } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

/** `redirectTo`: the page to open once signed in (defaults to home). */
export function AuthForm({ redirectTo = "/" }: { redirectTo?: string }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    setPending(true);
    setError(null);

    const { error } =
      mode === "sign-in"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({
            email,
            password,
            name: String(form.get("name")),
            username: String(form.get("username")).toLowerCase(),
          });

    setPending(false);
    if (error) return setError(error.message ?? "Algo deu errado");
    // New session: start from an empty cache so nothing from a previous account shows up.
    await clearCache();
    await navigate({ to: redirectTo });
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <Logo className="mb-6 h-16" />
      <h1 className="text-4xl font-medium italic">
        {mode === "sign-in" ? "Bem-vindo ao Grimo" : "Crie sua conta"}
      </h1>
      <p className="mt-2 mb-8 text-text-muted">
        {mode === "sign-in" ? "Entre para continuar de onde parou." : "Seu grimório começa aqui."}
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        {mode === "sign-up" && (
          <>
            <Input name="name" placeholder="Seu nome" required />
            <Input name="username" placeholder="usuario" required pattern="[a-zA-Z0-9_.]{3,30}" />
          </>
        )}
        <Input name="email" type="email" placeholder="email@exemplo.com" required />
        <Input name="password" type="password" placeholder="Senha" minLength={8} required />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={pending} className="mt-2 py-3">
          {mode === "sign-in" ? "Entrar" : "Criar conta"}
        </Button>
      </form>
      <Button
        variant="ghost"
        className="mt-3 w-full"
        onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
      >
        {mode === "sign-in" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
      </Button>
    </div>
  );
}
