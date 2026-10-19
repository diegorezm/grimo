import { useInstance } from "@grimo/client";
import { useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearCache } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

export function AuthForm() {
  const navigate = useNavigate();
  const { data: instance } = useInstance();
  const [chosenMode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  // Personal instance without an account yet → this form creates the owner account.
  const isSetup = instance?.mode === "personal" && instance.registrationOpen;
  const canSignUp = instance?.registrationOpen ?? false;
  const mode = isSetup ? "sign-up" : canSignUp ? chosenMode : "sign-in";
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
    await navigate({ to: "/" });
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <span className="mb-8 flex size-12 items-center justify-center rounded-full border border-ornament bg-surface">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 fill-none stroke-ornament">
          <path strokeWidth="1.5" d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
        </svg>
      </span>
      <h1 className="text-4xl font-medium italic">
        {mode === "sign-in" ? `Bem-vindo ao ${instance?.name ?? "Grimo"}` : "Crie sua conta"}
      </h1>
      <p className="mt-2 mb-8 text-text-muted">
        {isSetup
          ? "Crie a sua conta. Este Grimo é só seu: o cadastro fecha depois dela."
          : mode === "sign-in"
            ? "Entre para continuar de onde parou."
            : "Seu grimório começa aqui."}
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
      {canSignUp && !isSetup && (
        <Button
          variant="ghost"
          className="mt-3 w-full"
          onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
        >
          {mode === "sign-in" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        </Button>
      )}
    </div>
  );
}
