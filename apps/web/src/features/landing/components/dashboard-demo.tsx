import { greetingFor } from "@grimo/core";
import { QueryClientProvider } from "@tanstack/react-query";
import { useLayoutEffect, useRef, useState } from "react";
import { APP_NAV } from "@/components/layout/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { SearchIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { Dashboard } from "@/features/dashboard";
import { cn } from "@/utils/cn";
import { createDemoQueryClient, demoMe } from "../demo-data";

/** The demo renders at a real desktop size and is scaled down to fit. */
const WIDTH = 1280;
const HEIGHT = 800;

/**
 * The real home screen (`Dashboard`: shelves, carousel, goal, month, feed) fed by the demo
 * reader, inside the app's chrome. The chrome is drawn here because `AppShell` sizes itself to
 * the viewport; everything inside it is the actual component, so the demo follows the app.
 */
export function DashboardDemo({ className }: { className?: string }) {
  const [client] = useState(createDemoQueryClient);
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useLayoutEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setScale(entry.contentRect.width / WIDTH);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-surface shadow-2xl shadow-shadow",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-muted px-4 py-2.5">
        {["bg-accent-start", "bg-gold", "bg-accent"].map((color) => (
          <span key={color} className={cn("size-2.5 rounded-full opacity-70", color)} />
        ))}
        <span className="ml-3 flex-1 truncate rounded-full bg-surface px-3 py-1 font-mono text-[10px] text-text-muted">
          grimo.app
        </span>
      </div>
      <div ref={frame} style={{ height: HEIGHT * scale }} className="relative overflow-hidden">
        <div
          style={{ width: WIDTH, height: HEIGHT, transform: `scale(${scale})` }}
          className="absolute top-0 left-0 origin-top-left"
        >
          <QueryClientProvider client={client}>
            <div className="flex h-full bg-surface">
              <Sidebar />
              <div className="@container/main flex min-w-0 flex-1 flex-col">
                <TopBar />
                <main className="min-h-0 flex-1 overflow-hidden">
                  <Dashboard />
                </main>
              </div>
            </div>
          </QueryClientProvider>
        </div>
      </div>
    </div>
  );
}

/** The app's sidebar, as on desktop, with "Início" selected. */
function Sidebar() {
  return (
    <aside className="flex w-24 shrink-0 flex-col items-stretch border-r border-border py-6">
      <Logo className="mb-8 h-10 self-center" />
      <nav className="flex flex-col gap-1">
        {APP_NAV.map((item) => (
          <span
            key={item.to}
            className={cn(
              "flex flex-col items-center gap-1.5 py-3.5 text-xs",
              item.to === "/" ? "bg-surface-muted font-semibold text-accent" : "text-text-muted",
            )}
          >
            <item.icon className="size-6" />
            {item.label}
          </span>
        ))}
      </nav>
      <Avatar
        src={null}
        name={demoMe.name}
        size="size-11"
        className="bg-accent-gradient mt-auto self-center font-semibold text-accent-foreground shadow-md shadow-accent/30"
      />
    </aside>
  );
}

/** The app's top bar: search and greeting. */
function TopBar() {
  return (
    <header className="flex items-center justify-between gap-4 px-8 pt-7 pb-2">
      <div className="flex max-w-xl flex-1 items-center gap-2 rounded-full bg-surface-muted p-1.5 pl-5">
        <SearchIcon className="text-text-muted" />
        <span className="flex-1 py-1.5 text-sm text-text-muted">Buscar livros, autores…</span>
        <span className="bg-accent-gradient rounded-full px-6 py-2 font-mono text-xs font-medium uppercase tracking-wider text-accent-foreground shadow-md shadow-accent/30">
          Buscar
        </span>
      </div>
      <span className="text-right text-sm leading-tight">
        <span className="block text-text-muted">{greetingFor(new Date())},</span>
        <strong className="font-semibold">{demoMe.name}</strong>
      </span>
    </header>
  );
}
