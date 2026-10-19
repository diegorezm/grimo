import { useInstance, useMe } from "@grimo/client";
import { greetingFor } from "@grimo/core";
import { Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, type ReactNode, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { HomeIcon, SearchIcon, ShelvesIcon, UserIcon } from "@/components/ui/icons";
import { ThemeCycleButton, ThemeToggle } from "@/components/ui/theme-toggle";

const nav = [
  { to: "/", label: "Início", personalLabel: "Diário", icon: HomeIcon },
  { to: "/shelves", label: "Estantes", icon: ShelvesIcon },
  { to: "/search", label: "Buscar", icon: SearchIcon },
  { to: "/me", label: "Perfil", icon: UserIcon },
] as const;

type NavItem = (typeof nav)[number];

/**
 * Desktop: full-screen app — icon sidebar on the left, search bar on top.
 * Mobile: compact header and a floating glass tab bar.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { data: instance } = useInstance();
  const personal = instance?.mode === "personal";
  const label = (item: NavItem) =>
    personal && "personalLabel" in item ? item.personalLabel : item.label;

  return (
    <div className="min-h-dvh">
      <div className="flex min-h-dvh lg:bg-surface">
        <aside className="sticky top-0 hidden h-dvh w-22 shrink-0 flex-col items-center gap-2 border-r border-border py-6 lg:flex">
          <Link to="/" aria-label={instance?.name ?? "Grimo"} className="mb-6">
            <Emblem />
          </Link>
          <nav aria-label="Seções" className="flex flex-col gap-2">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                title={label(item)}
                aria-label={label(item)}
                className="grid size-11 place-items-center rounded-md transition"
                activeProps={{ className: "bg-shelf-reading-bg text-shelf-reading-fg" }}
                inactiveProps={{
                  className: "text-text-muted hover:bg-surface-muted hover:text-text",
                }}
                activeOptions={{ exact: item.to === "/" }}
              >
                <item.icon />
              </Link>
            ))}
          </nav>
          <div className="mt-auto flex flex-col items-center gap-3">
            <ThemeCycleButton />
            <span className="bg-accent-gradient rotate-180 rounded-full px-1.5 py-4 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-accent-foreground [writing-mode:vertical-rl]">
              {personal ? "Pessoal" : "Grimo"}
            </span>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 pb-32 lg:pb-0">{children}</main>
        </div>
      </div>

      <nav className="glass fixed inset-x-4 bottom-6 z-10 mx-auto flex max-w-md justify-around gap-1 rounded-full p-1.5 font-mono text-[11px] uppercase tracking-wider lg:hidden">
        {nav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex-1 rounded-full px-3 py-2.5 text-center transition"
            activeProps={{ className: "bg-shelf-reading-bg text-text" }}
            inactiveProps={{ className: "text-text-muted hover:text-text" }}
            activeOptions={{ exact: item.to === "/" }}
          >
            {label(item)}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function TopBar() {
  const { data: instance } = useInstance();
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
        <Emblem />
        <span className="font-serif text-2xl font-bold">{instance?.name ?? "Grimo"}</span>
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
        {me && (
          <Link to="/me" className="hidden items-center gap-3 lg:flex">
            <span className="text-right text-sm leading-tight">
              <span className="block text-text-muted">{greetingFor(new Date())},</span>
              <strong className="font-semibold">{me.name}</strong>
            </span>
            <Avatar
              src={me.image}
              name={me.name}
              className="bg-accent-gradient font-semibold text-accent-foreground"
            />
          </Link>
        )}
      </div>
    </header>
  );
}

/** Journal emblem: a four-point sparkle in a lilac ring. */
function Emblem() {
  return (
    <span className="flex size-11 items-center justify-center rounded-full border border-ornament bg-surface">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-ornament">
        <path strokeWidth="1.5" d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
      </svg>
    </span>
  );
}
