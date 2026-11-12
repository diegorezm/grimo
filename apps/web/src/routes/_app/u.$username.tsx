import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/u/$username")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_app/u/$username"!</div>;
}
