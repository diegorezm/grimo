import { profileShelfQuery } from "@grimo/client";
import { createFileRoute } from "@tanstack/react-router";
import { FullShelf } from "@/features/shelves";

/** One whole shelf of a reader ("reading", "read" or a shelf id), opened from their profile. */
export const Route = createFileRoute("/_app/u/$username_/estante/$shelf")({
  loader: ({ context: { queryClient }, params }) => {
    void queryClient.prefetchQuery(profileShelfQuery(params.username, params.shelf));
  },
  component: FullShelfPage,
});

function FullShelfPage() {
  const { username, shelf } = Route.useParams();
  return <FullShelf username={username} shelf={shelf} />;
}
