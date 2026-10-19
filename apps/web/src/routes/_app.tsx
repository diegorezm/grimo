import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { BookPeek } from "@/features/books";
import { ProfilePeek } from "@/features/profile";
import { sessionQuery } from "@/lib/api";

/**
 * Layout for every signed-in page. Search params open a side peek next to any screen:
 * `?book=<openLibraryId>` (book page) or `?panel=profile` (edit profile).
 */
export const Route = createFileRoute("/_app")({
  validateSearch: (search: Record<string, unknown>): { book?: string; panel?: "profile" } => ({
    book: typeof search.book === "string" && search.book ? search.book : undefined,
    panel: search.panel === "profile" ? "profile" : undefined,
  }),
  beforeLoad: async ({ context }) => {
    const data = await context.queryClient.ensureQueryData(sessionQuery);
    if (!data) throw redirect({ to: "/login" });
    return { session: data };
  },
  component: AppLayout,
});

function AppLayout() {
  const { book, panel } = Route.useSearch();
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
