import { useMe, useSyncTimeZone } from "@grimo/client";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { useCallback, useEffect } from "react";
import { ErrorScreen } from "@/components/feedback/error-screen";
import { AppShell } from "@/components/layout/app-shell";
import { PublicShell } from "@/components/layout/public-shell";
import { SidePeek } from "@/components/layout/side-peek";
import { VerifyEmailBanner } from "@/features/account";
import { BookPeek } from "@/features/books";
import { LegalGate } from "@/features/legal";
import { ModeratorInviteBanner } from "@/features/moderation";
import { NotificationBell } from "@/features/notifications";
import { PostPeek } from "@/features/posts";
import { ProfilePeek } from "@/features/profile";
import { sessionQuery, signOutLocally } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

/** Pages a signed-out visitor may open: profiles and invites, so shared links work for anyone. */
const isPublicPath = (pathname: string) => pathname.startsWith("/u/") || pathname.startsWith("/j/");

/**
 * Layout for every app page. Search params open a side peek next to any screen:
 * `?book=<openLibraryId>` (book page), `?post=<id>` (post and comments) or `?panel=profile`
 * (edit profile).
 * Signed out, only public pages render (in `PublicShell`); everything else goes to /login.
 */
export const Route = createFileRoute("/_app")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { book?: string; post?: string; panel?: "profile" } => ({
    book: typeof search.book === "string" && search.book ? search.book : undefined,
    post: typeof search.post === "string" && search.post ? search.post : undefined,
    panel: search.panel === "profile" ? "profile" : undefined,
  }),
  beforeLoad: async ({ context, location }) => {
    const data = await context.queryClient.ensureQueryData(sessionQuery);
    if (!data) {
      if (isPublicPath(location.pathname)) return { session: null };
      // The home of a visitor is the landing page; deep links go to sign-in.
      throw redirect(location.pathname === "/" ? { to: "/welcome" } : { to: "/login" });
    }
    return { session: data };
  },
  component: AppLayout,
  // A screen that throws keeps the shell (navigation) and shows the error inside it.
  errorComponent: ({ reset }) => <ErrorScreen reset={reset} />,
});

function AppLayout() {
  const { session } = Route.useRouteContext();
  const { book, post, panel } = Route.useSearch();

  if (!session) {
    return (
      <PublicShell aside={book ? <SignInPeek /> : undefined}>
        <Outlet />
      </PublicShell>
    );
  }

  return <SignedInLayout book={book} post={post} panel={panel} />;
}

function SignedInLayout({
  book,
  post,
  panel,
}: {
  book?: string;
  post?: string;
  panel?: "profile";
}) {
  useSessionGuard();
  useSetupGuard();
  useSyncTimeZone();
  const aside = book ? (
    <BookPeek key={book} openLibraryId={book} />
  ) : post ? (
    <PostPeek key={post} postId={post} />
  ) : panel === "profile" ? (
    <ProfilePeek />
  ) : undefined;
  return (
    <AppShell aside={aside} actions={<NotificationBell />}>
      <VerifyEmailBanner />
      <ModeratorInviteBanner />
      <Outlet />
      {/* Terms changed (or never accepted): agree again before going on. */}
      <LegalGate />
    </AppShell>
  );
}

/**
 * The server says the session is gone (expired, revoked, signed out elsewhere): clear the cache
 * and go to /login. A network error is not that: offline, the app keeps running on the cache.
 */
function useSessionGuard() {
  const { data, error, isPending } = authClient.useSession();
  const signedOut = !isPending && !data && (!error || error.status === 401);
  useEffect(() => {
    if (signedOut) signOutLocally();
  }, [signedOut]);
}

/** A new account (no name or @ yet) goes through the onboarding first. */
function useSetupGuard() {
  const needsSetup = useMe().data?.needsSetup ?? false;
  const navigate = useNavigate();
  useEffect(() => {
    if (needsSetup) void navigate({ to: "/onboarding", replace: true });
  }, [needsSetup, navigate]);
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
