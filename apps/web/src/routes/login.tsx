import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/feedback/spinner";
import { BookStack } from "@/components/ui/book-stack";
import { Sparkle } from "@/components/ui/sparkle";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AuthForm } from "@/features/auth";
import { clearCacheForSignIn } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
  // Where to go after signing in (e.g. the profile a shared link pointed to). Same-site paths only.
  validateSearch: (search: Record<string, unknown>): { redirect?: string; ott?: string } => ({
    // One-time token from a Google sign-in (the auth provider exchanges it for the session).
    ott: typeof search.ott === "string" ? search.ott : undefined,
    redirect:
      typeof search.redirect === "string" &&
      search.redirect.startsWith("/") &&
      !search.redirect.startsWith("//")
        ? search.redirect
        : undefined,
  }),
  component: LoginPage,
});

/** Full-screen split: illustration on the left (desktop), the form on the right. */
function LoginPage() {
  const { redirect, ott } = Route.useSearch();
  const returning = useGoogleReturn(Boolean(ott), redirect);
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
        {returning ? <Spinner label="Entrando com Google…" /> : <AuthForm redirectTo={redirect} />}
      </main>
    </div>
  );
}

/**
 * Back from Google: the auth provider swaps the one-time token in the URL for a session. Once it
 * shows up, start from a clean cache and go on (new accounts: the onboarding).
 */
function useGoogleReturn(active: boolean, redirect = "/") {
  const navigate = useNavigate();
  const session = authClient.useSession();
  const [waiting, setWaiting] = useState(active);
  const signedIn = Boolean(session.data);

  useEffect(() => {
    if (!waiting || !signedIn) return;
    void clearCacheForSignIn().then(() => navigate({ to: redirect }));
  }, [waiting, signedIn, redirect, navigate]);

  // The token can be stale (reloaded page): fall back to the form.
  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(() => setWaiting(false), 8000);
    return () => clearTimeout(timer);
  }, [waiting]);

  return waiting;
}
