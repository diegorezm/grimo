import type { ConvexCache } from "@grimo/client";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { ErrorScreen } from "@/components/feedback/error-screen";
import { CookieNotice } from "@/features/legal";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient; cache: ConvexCache }>()(
  {
    component: Root,
    errorComponent: ({ reset }) => <ErrorScreen reset={reset} />,
  },
);

function Root() {
  return (
    <>
      <Outlet />
      <CookieNotice />
    </>
  );
}
