import { listQuery } from "@grimo/client";
import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/layout/screen";
import { ListView } from "@/features/lists";

/** A reader's list. Opens signed out too, so it can be shared anywhere. */
export const Route = createFileRoute("/_app/listas/$id")({
  loader: ({ context: { queryClient }, params: { id } }) => {
    void queryClient.prefetchQuery(listQuery(id));
  },
  component: ListPage,
});

function ListPage() {
  const { id } = Route.useParams();
  const { session } = Route.useRouteContext();
  return (
    <Screen back="Voltar">
      <ListView id={id} signedIn={Boolean(session)} />
    </Screen>
  );
}
