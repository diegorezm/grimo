import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { sessionQuery } from "@/lib/api";

/** Layout for every signed-in page. */
export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context }) => {
    const data = await context.queryClient.ensureQueryData(sessionQuery);
    if (!data) throw redirect({ to: "/login" });
    return { session: data };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
