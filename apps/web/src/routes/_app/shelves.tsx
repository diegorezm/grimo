import { myShelvesQuery, shelfQuery } from "@grimo/client";
import { createFileRoute } from "@tanstack/react-router";
import { ShelfScreen } from "@/features/shelves";

export const Route = createFileRoute("/_app/shelves")({
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(shelfQuery());
    void queryClient.prefetchQuery(myShelvesQuery());
  },
  component: ShelfScreen,
});
