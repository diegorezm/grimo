import { useInstance } from "@grimo/client";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/logo";
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
      <header className="flex flex-wrap items-center justify-between gap-3 py-5">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo className="h-9" />
          <span className="font-serif text-2xl font-bold">{instance?.name ?? "Grimo"}</span>
        </Link>
        <ThemeToggle />
      </header>
      {/* Bottom padding leaves room for the floating glass nav. */}
      <main className="flex-1 pt-2 pb-32">{children}</main>
      <nav className="glass fixed inset-x-4 bottom-6 z-10 mx-auto flex max-w-md justify-around gap-1 rounded-full p-1.5 font-mono text-[11px] uppercase tracking-wider">
        {nav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex-1 rounded-full px-3 py-2.5 text-center transition"
            activeProps={{ className: "bg-shelf-reading-bg text-text" }}
            inactiveProps={{ className: "text-text-muted hover:text-text" }}
            activeOptions={{ exact: item.to === "/" }}
          >
            {personal && "personalLabel" in item ? item.personalLabel : item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
