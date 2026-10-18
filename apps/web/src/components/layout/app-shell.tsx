import { useInstance } from "@grimo/client";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

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
      <header className="flex items-center justify-between py-5">
        <Link to="/" className="font-serif text-2xl font-bold">
          {instance?.name ?? "Grimo"}
        </Link>
        <nav className="flex gap-1 text-sm">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-1.5 text-text-muted hover:text-text"
              activeProps={{ className: "bg-surface-muted text-text" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {personal && "personalLabel" in item ? item.personalLabel : item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1 pb-12">{children}</main>
    </div>
  );
}
