import { createFileRoute } from "@tanstack/react-router";
import { BookStack } from "@/components/ui/book-stack";
import { Sparkle } from "@/components/ui/sparkle";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AuthForm } from "@/features/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

/** Full-screen split: illustration on the left (desktop), the form on the right. */
function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:bg-surface">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-surface-muted p-12 lg:flex">
        <Sparkle className="absolute top-16 right-24 size-5" />
        <Sparkle className="absolute right-16 bottom-56 size-3.5 fill-accent" />
        <Sparkle className="absolute top-1/3 left-1/4 size-3 fill-accent-start" />
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-text-muted">
          Um diário de leituras
        </p>
        <div className="grid place-items-center py-16">
          <BookStack large />
        </div>
        <div className="max-w-md">
          <h2 className="text-4xl leading-tight font-medium italic">
            O que cada livro deixou em você.
          </h2>
          <p className="mt-3 text-text-muted">
            Estantes, progresso, resenhas e um resumo do mês pronto para compartilhar.
          </p>
        </div>
      </aside>

      <main className="relative grid place-items-center px-4 py-16">
        <ThemeToggle className="absolute top-5 right-5" />
        <AuthForm />
      </main>
    </div>
  );
}
