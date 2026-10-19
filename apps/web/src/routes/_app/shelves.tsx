import { shelfQuery, useShelf } from "@grimo/client";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen } from "@/components/layout/screen";
import { ShelfBoard } from "@/features/shelves";

export const Route = createFileRoute("/_app/shelves")({
  loader: ({ context: { queryClient, api } }) => {
    void queryClient.prefetchQuery(shelfQuery(api));
  },
  component: ShelvesPage,
});

function ShelvesPage() {
  const total = useShelf().data?.items.length;
  return (
    <Screen
      title="Estantes"
      subtitle={total === undefined ? undefined : `${total} livros no seu grimório`}
      actions={
        <Link
          to="/search"
          className="bg-accent-gradient rounded-full px-5 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-accent-foreground shadow-md shadow-accent/30 hover:opacity-90"
        >
          + Adicionar livro
        </Link>
      }
    >
      <ShelfBoard />
    </Screen>
  );
}
