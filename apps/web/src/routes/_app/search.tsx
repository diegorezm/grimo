import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/layout/screen";
import { BookSearch } from "@/features/books";

export const Route = createFileRoute("/_app/search")({
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === "string" && search.q ? search.q : undefined,
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  return (
    <Screen title="Buscar livros" subtitle="Encontre o próximo livro no catálogo do Open Library.">
      <BookSearch key={q} initialQuery={q} />
    </Screen>
  );
}
