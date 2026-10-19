import { type ConnectionKind, useReaderConnections } from "@grimo/client";
import { Spinner } from "@/components/feedback/spinner";
import { LoadMore } from "@/components/ui/load-more";
import { ReaderGrid, ReaderTile } from "./reader-tile";

/** Who follows a reader, or whom they follow. Scrolls for more. */
export function ConnectionsList({
  username,
  kind,
  viewerId,
}: {
  username: string;
  kind: ConnectionKind;
  /** The signed-in reader (null when signed out): no follow button for yourself. */
  viewerId: string | null;
}) {
  const connections = useReaderConnections(username, kind);
  const items = connections.data?.items ?? [];

  if (connections.isPending) return <Spinner />;
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-6 py-8 text-center text-sm text-text-muted">
        {kind === "followers" ? "Ninguém segue este perfil ainda." : "Não segue ninguém ainda."}
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
            canFollow={viewerId !== null && reader.id !== viewerId}
          />
        ))}
      </ReaderGrid>
      <LoadMore {...connections} />
    </div>
  );
}
