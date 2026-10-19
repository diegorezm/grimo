import { useReaderSuggestions } from "@grimo/client";
import { Spinner } from "@/components/feedback/spinner";
import { LoadMore } from "@/components/ui/load-more";
import { ReaderGrid, ReaderTile } from "./reader-tile";

/** Readers to follow: people followed by people you follow come first. Scrolls for more. */
export function ReaderSuggestions() {
  const suggestions = useReaderSuggestions();
  const items = suggestions.data?.pages.flatMap((page) => page.items) ?? [];

  if (suggestions.isPending) return <Spinner />;
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-6 py-8 text-center text-sm text-text-muted">
        Você já segue todo mundo por aqui. Chame mais gente compartilhando o seu perfil.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <ReaderGrid>
        {items.map((reader) => (
          <ReaderTile
            key={reader.id}
            reader={reader}
            canFollow
            note={
              reader.mutualName
                ? reader.mutuals > 1
                  ? `Seguido por ${reader.mutualName} e mais ${reader.mutuals - 1}`
                  : `Seguido por ${reader.mutualName}`
                : undefined
            }
          />
        ))}
      </ReaderGrid>
      <LoadMore {...suggestions} />
    </div>
  );
}
