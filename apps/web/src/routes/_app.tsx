import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { authClient } from "@/lib/auth-client";

/** Layout for every signed-in page. */
export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (!data) throw redirect({ to: "/login" });
    return { session: data };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
