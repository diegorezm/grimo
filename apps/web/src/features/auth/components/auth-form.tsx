import { queryKeys, useInstance } from "@grimo/client";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { authClient } from "@/lib/auth-client";

export function AuthForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
    await queryClient.invalidateQueries({ queryKey: queryKeys.instance });
    await navigate({ to: "/" });
  }

  return (
    <Card className="mx-auto w-full max-w-sm p-6">
      <Logo className="mb-4 h-16" />
      <h1 className="mb-1 text-3xl font-bold">{instance?.name ?? "Grimo"}</h1>
      <p className="mb-6 text-sm text-text-muted">
        {isSetup
          ? "Crie a sua conta. Este Grimo é só seu: o cadastro fecha depois dela."
          : "O que cada livro deixou em você."}
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        {mode === "sign-up" && (
          <>
            <Input name="name" placeholder="Seu nome" required />
            <Input name="username" placeholder="usuario" required pattern="[a-zA-Z0-9_.]{3,30}" />
          </>
        )}
        <Input name="email" type="email" placeholder="email@exemplo.com" required />
        <Input name="password" type="password" placeholder="Senha" minLength={8} required />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={pending}>
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
    </Card>
  );
}
