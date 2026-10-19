import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { cache, queryClient } from "@/lib/api";
import { AppProviders } from "@/providers/app-providers";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

const router = createRouter({
  routeTree,
  context: { queryClient, cache },
  // Hovering a link runs its loader, which warms the query cache.
  defaultPreload: "intent",
  // Freshness is TanStack Query's call (see staleTimes in @grimo/client), not the router's.
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
