import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LegalLinks } from "./legal-links";

/** "2026-10-19" → "19 de outubro de 2026". */
export function legalDate(version: string) {
  return new Date(`${version}T12:00:00Z`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Frame of the public legal pages (Terms, Privacy, account deletion): readable for anyone,
 * signed in or not, with the other documents linked at the bottom.
 */
export function LegalPage({
  title,
  version,
  intro,
  children,
}: {
  title: string;
  /** Date of the text (`YYYY-MM-DD`), shown as "Atualizado em". */
  version?: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-surface">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-5">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo className="h-9" />
          <span className="font-serif text-2xl font-bold">Grimo</span>
        </Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-16">
        <h1 className="text-4xl leading-tight font-medium italic sm:text-5xl">{title}</h1>
        {version && (
          <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-text-muted">
            Atualizado em {legalDate(version)}
          </p>
        )}
        {intro && <div className="mt-6 text-lg leading-relaxed">{intro}</div>}
        <div className="legal-prose mt-10 flex flex-col gap-10">{children}</div>
      </main>
      <footer className="mx-auto w-full max-w-3xl border-t border-border px-4 py-8">
        <LegalLinks />
      </footer>
    </div>
  );
}

/** A numbered section of a legal document. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 leading-relaxed">
      <h2 className="font-serif text-2xl font-medium">{title}</h2>
      {children}
    </section>
  );
}

export function List({ children }: { children: ReactNode }) {
  return (
    <ul className="ml-5 flex list-disc flex-col gap-1.5 marker:text-text-muted">{children}</ul>
  );
}

/** Contact email as a link. */
export function Mail({ email }: { email: string }) {
  return (
    <a href={`mailto:${email}`} className="text-accent underline underline-offset-4">
      {email}
    </a>
  );
}
