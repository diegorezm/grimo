import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/features/landing";

/** Public landing page. Signed-out visitors to `/` land here. */
export const Route = createFileRoute("/welcome")({
  staticData: { seo: { path: "/welcome" } },
  component: LandingPage,
});
