import { useInstance } from "@grimo/client";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const nav = [
  { to: "/", label: "Feed", personalLabel: "Diário" },
  { to: "/search", label: "Buscar" },
  { to: "/shelves", label: "Estantes" },
  { to: "/me", label: "Perfil" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { data: instance } = useInstance();
  const personal = instance?.mode === "personal";
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-5">
        <Link to="/" className="font-serif text-2xl font-bold">
          {instance?.name ?? "Grimo"}
        </Link>
        <nav className="flex gap-1 font-mono text-xs uppercase tracking-wider">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-sm px-2.5 py-1.5"
              activeProps={{ className: "bg-primary text-primary-foreground" }}
              inactiveProps={{ className: "text-text-muted hover:text-text" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {personal && "personalLabel" in item ? item.personalLabel : item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1 py-6">{children}</main>
      {/* Status bar, like the footer of an archive catalog. */}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-4 font-mono text-[11px] uppercase tracking-wider text-text-muted">
        <span className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-accent" />
          {personal ? "Instância pessoal" : "Comunidade"}
        </span>
        <ThemeToggle />
      </footer>
    </div>
  );
}
