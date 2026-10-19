import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/**
 * Frame for pages a signed-out visitor can open (a shared profile link): brand on the left,
 * sign-in on the right. Signing in comes back to the same page.
 */
export function PublicShell({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-dvh lg:bg-surface">
      <div className="@container/main flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 px-4 py-5 lg:px-8">
          <Link to="/login" search={{ redirect: pathname }} className="flex items-center gap-2.5">
            <Logo className="h-10" />
            <span className="font-serif text-2xl font-bold">Grimo</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              search={{ redirect: pathname }}
              className="bg-accent-gradient rounded-full px-5 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-accent-foreground shadow-md shadow-accent/30 hover:opacity-90"
            >
              Entrar
            </Link>
          </div>
        </header>
        <main className="flex-1 pb-12">{children}</main>
      </div>
      {aside}
    </div>
  );
}
