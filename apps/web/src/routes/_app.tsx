import { createFileRoute, Link, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PublicShell } from "@/components/layout/public-shell";
import { SidePeek } from "@/components/layout/side-peek";
import { BookPeek } from "@/features/books";
import { ProfilePeek } from "@/features/profile";
import { sessionQuery } from "@/lib/api";

/** Pages a signed-out visitor may open: reader profiles, so shared links work for anyone. */
const isPublicPath = (pathname: string) => pathname.startsWith("/u/");

/**
 * Layout for every app page. Search params open a side peek next to any screen:
 * `?book=<openLibraryId>` (book page) or `?panel=profile` (edit profile).
 * Signed out, only public pages render (in `PublicShell`); everything else goes to /login.
 */
export const Route = createFileRoute("/_app")({
  validateSearch: (search: Record<string, unknown>): { book?: string; panel?: "profile" } => ({
    book: typeof search.book === "string" && search.book ? search.book : undefined,
    panel: search.panel === "profile" ? "profile" : undefined,
  }),
  beforeLoad: async ({ context, location }) => {
    const data = await context.queryClient.ensureQueryData(sessionQuery);
    if (!data) {
      if (isPublicPath(location.pathname)) return { session: null };
      throw redirect({ to: "/login" });
    }
    return { session: data };
  },
  component: AppLayout,
});

function AppLayout() {
  const { session } = Route.useRouteContext();
  const { book, panel } = Route.useSearch();

  if (!session) {
    return (
      <PublicShell aside={book ? <SignInPeek /> : undefined}>
        <Outlet />
      </PublicShell>
    );
  }

  const aside = book ? (
    <BookPeek key={book} openLibraryId={book} />
  ) : panel === "profile" ? (
    <ProfilePeek />
  ) : undefined;
  return (
    <AppShell aside={aside}>
      <Outlet />
    </AppShell>
  );
}

/** Signed out, a book link opens an invitation instead of the book page. */
function SignInPeek() {
  const navigate = Route.useNavigate();
  const { pathname } = useLocation();
  const close = useCallback(
    () =>
      void navigate({
        to: ".",
        search: (prev) => ({ ...prev, book: undefined }),
        resetScroll: false,
      }),
    [navigate],
  );
  return (
    <SidePeek label="Entrar" onClose={close}>
      <div className="flex flex-col items-start gap-4 py-10">
        <h2 className="text-3xl font-medium italic">Gostou dessa leitura?</h2>
        <p className="text-text-muted">
          Entre para ver o livro, guardar na sua estante e seguir quem lê com você.
        </p>
        <Link
          to="/login"
          search={{ redirect: pathname }}
          className="bg-accent-gradient rounded-full px-6 py-3 font-mono text-xs font-medium uppercase tracking-wider text-accent-foreground shadow-md shadow-accent/30 hover:opacity-90"
        >
          Entrar ou criar conta
        </Link>
      </div>
    </SidePeek>
  );
}
