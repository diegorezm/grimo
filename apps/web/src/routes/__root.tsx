import type { ConvexCache } from "@grimo/client";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient; cache: ConvexCache }>()(
  {
    component: Outlet,
  },
);
