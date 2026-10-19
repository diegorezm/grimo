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
      <header className="flex flex-wrap items-center justify-between gap-3 py-5">
        <Link to="/" className="flex items-center gap-2.5">
          {/* Journal emblem: a four-point sparkle in a lilac ring. */}
          <span className="flex size-10 items-center justify-center rounded-full border border-ornament bg-surface">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-5 fill-none stroke-ornament"
            >
              <path
                strokeWidth="1.5"
                d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"
              />
            </svg>
          </span>
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
