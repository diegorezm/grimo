import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { BookPeek } from "@/features/books";
import { sessionQuery } from "@/lib/api";

/**
 * Layout for every signed-in page. `?book=<openLibraryId>` on any screen opens that book in a
 * side peek next to it.
 */
export const Route = createFileRoute("/_app")({
  validateSearch: (search: Record<string, unknown>): { book?: string } => ({
    book: typeof search.book === "string" && search.book ? search.book : undefined,
  }),
  beforeLoad: async ({ context }) => {
    const data = await context.queryClient.ensureQueryData(sessionQuery);
    if (!data) throw redirect({ to: "/login" });
    return { session: data };
  },
  component: AppLayout,
});

function AppLayout() {
  const { book } = Route.useSearch();
  return (
    <AppShell aside={book ? <BookPeek key={book} openLibraryId={book} /> : undefined}>
      <Outlet />
    </AppShell>
  );
}
