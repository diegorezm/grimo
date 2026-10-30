import { useMe } from "@grimo/client";
import { greetingFor } from "@grimo/core";
import { Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, type ReactNode, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import {
  HomeIcon,
  PeopleIcon,
  SearchIcon,
  ShelvesIcon,
  ShieldIcon,
  TogetherIcon,
  UserIcon,
} from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { ThemeCycleButton, ThemeToggle } from "@/components/ui/theme-toggle";

/**
 * Main sections (also drawn by the landing page demo). The phone bar has room for five:
 * "Leitores" stays in the sidebar (on phones it's reached from search and profiles).
 */
export const APP_NAV = [
  { to: "/", label: "Início", icon: HomeIcon, phone: true },
  { to: "/search", label: "Buscar", icon: SearchIcon, phone: true },
  { to: "/juntos", label: "Juntos", icon: TogetherIcon, phone: true },
  { to: "/shelves", label: "Estantes", icon: ShelvesIcon, phone: true },
  { to: "/people", label: "Leitores", icon: PeopleIcon, phone: false },
  { to: "/me", label: "Perfil", icon: UserIcon, phone: true },
] as const;

/**
 * Desktop: full-screen app — icon sidebar on the left, search bar on top.
 * Mobile: compact header and a floating glass tab bar.
 */
/**
 * `aside` is a side peek shown beside the page (see `SidePeek`); `actions` sit in the top bar
 * (the notification bell).
 */
export function AppShell({
  children,
  aside,
  actions,
}: {
  children: ReactNode;
  aside?: ReactNode;
  actions?: ReactNode;
}) {
  const { data: me } = useMe();

  return (
    <div className="min-h-dvh">
      <div className="flex min-h-dvh lg:bg-surface">
        <aside className="sticky top-0 hidden h-dvh w-24 shrink-0 flex-col items-stretch border-r border-border py-6 lg:flex">
          <Link to="/" aria-label="Grimo" className="mb-8 self-center">
            <Logo className="h-10" />
          </Link>
          <nav aria-label="Seções" className="flex flex-col gap-1">
            {APP_NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex flex-col items-center gap-1.5 py-3.5 text-xs transition"
                activeProps={{ className: "bg-surface-muted font-semibold text-accent" }}
                inactiveProps={{
                  className: "text-text-muted hover:bg-surface-muted/60 hover:text-text",
                }}
                activeOptions={{ exact: item.to === "/" }}
              >
                <item.icon className="size-6" />
                {item.label}
              </Link>
            ))}
            {me?.isStaff && (
              <Link
                to="/admin"
                className="flex flex-col items-center gap-1.5 py-3.5 text-xs transition"
                activeProps={{ className: "bg-surface-muted font-semibold text-accent" }}
                inactiveProps={{
                  className: "text-text-muted hover:bg-surface-muted/60 hover:text-text",
                }}
              >
                <ShieldIcon className="size-6" />
                Moderação
              </Link>
            )}
          </nav>
          <div className="mt-auto flex flex-col items-center gap-4">
            <ThemeCycleButton />
            {me && (
              <Link to="/me" aria-label="Seu perfil" title={me.name}>
                <Avatar
                  src={me.image}
                  name={me.name}
                  size="size-11"
                  className="bg-accent-gradient font-semibold text-accent-foreground shadow-md shadow-accent/30"
                />
              </Link>
            )}
          </div>
        </aside>

        {/* `@container/main`: screens adapt to the space left when a side peek is open. */}
        <div className="@container/main flex min-w-0 flex-1 flex-col">
          <TopBar actions={actions} />
          <main className="flex-1 pb-32 lg:pb-0">{children}</main>
        </div>
        {aside}
      </div>

      <nav className="glass fixed inset-x-4 bottom-6 z-10 mx-auto flex max-w-lg justify-around gap-1 rounded-full p-1.5 font-mono text-[10px] uppercase tracking-wider lg:hidden">
        {APP_NAV.filter((item) => item.phone).map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex-1 rounded-full px-1 py-2.5 text-center transition"
            activeProps={{ className: "bg-shelf-reading-bg text-text" }}
            inactiveProps={{ className: "text-text-muted hover:text-text" }}
            activeOptions={{ exact: item.to === "/" }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function TopBar({ actions }: { actions?: ReactNode }) {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    void navigate({ to: "/search", search: { q: query.trim() || undefined } });
  }

  return (
    <header className="flex items-center justify-between gap-4 px-4 py-5 lg:px-8 lg:pt-7 lg:pb-2">
      <Link to="/" className="flex items-center gap-2.5 lg:hidden">
        <Logo className="h-10" />
        <span className="font-serif text-2xl font-bold">Grimo</span>
      </Link>

      <search className="hidden max-w-xl flex-1 lg:block">
        <form
          onSubmit={submit}
          className="flex items-center gap-2 rounded-full bg-surface-muted p-1.5 pl-5"
        >
          <SearchIcon className="text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar livros, autores…"
            aria-label="Buscar livros"
            className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-text-muted"
          />
          <button
            type="submit"
            className="bg-accent-gradient rounded-full px-6 py-2 font-mono text-xs font-medium uppercase tracking-wider text-accent-foreground shadow-md shadow-accent/30 hover:opacity-90"
          >
            Buscar
          </button>
        </form>
      </search>

      <div className="flex items-center gap-4">
        <ThemeToggle className="lg:hidden" />
        {actions}
        {me?.isStaff && (
          <Link
            to="/admin"
            aria-label="Moderação"
            title="Moderação"
            className="text-text-muted hover:text-text lg:hidden"
          >
            <ShieldIcon className="size-6" />
          </Link>
        )}
        {me && (
          <Link to="/me" className="hidden items-center gap-3 lg:flex">
            <span className="text-right text-sm leading-tight">
              <span className="block text-text-muted">{greetingFor(new Date())},</span>
              <strong className="font-semibold">{me.name}</strong>
            </span>
          </Link>
        )}
      </div>
    </header>
  );
}
