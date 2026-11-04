import { useReaderSuggestions } from "@grimo/client";
import { Spinner } from "@/components/feedback/spinner";
import { LoadMore } from "@/components/ui/load-more";
import { ReaderGrid, ReaderTile } from "./reader-tile";

/**
 * Readers to follow: people followed by people you follow come first. Scrolls for more, or with
 * `limit` shows only the first few, stacked, for a side column.
 */
export function ReaderSuggestions({ limit }: { limit?: number }) {
  const suggestions = useReaderSuggestions();
  const all = suggestions.data?.items ?? [];
  const items = limit ? all.slice(0, limit) : all;

  if (suggestions.isPending) return <Spinner />;
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-6 py-8 text-center text-sm text-text-muted">
        Você já segue todo mundo por aqui. Chame mais gente compartilhando o seu perfil.
      </p>
    );
  }

  const tiles = items.map((reader) => (
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
  ));
  if (limit) return <ul className="flex flex-col gap-2">{tiles}</ul>;

  return (
    <div className="flex flex-col gap-2">
      <ReaderGrid>{tiles}</ReaderGrid>
      <LoadMore {...suggestions} />
    </div>
  );
}
