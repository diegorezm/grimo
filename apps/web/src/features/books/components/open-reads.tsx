import { errorMessage, type OpenRead, useJoinOpenRead, useOpenReads } from "@grimo/client";
import { membersLabel } from "@grimo/core";
import { Link, useNavigate } from "@tanstack/react-router";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { Button } from "@/components/ui/button";
import { formatFinishBy } from "@/components/ui/finish-picker";
import { authClient } from "@/lib/auth-client";

/** "Leituras abertas" of a book: groups anyone can join, without an invite. */
export function OpenReads({ openLibraryId }: { openLibraryId: string }) {
  const reads = useOpenReads(openLibraryId).data?.items ?? [];
  const signedIn = Boolean(authClient.useSession().data);
  if (reads.length === 0) return null;
  return (
    <section aria-labelledby="open-reads" className="flex flex-col gap-3">
      <h2 id="open-reads" className="text-2xl font-medium italic">
        Leituras abertas
      </h2>
      <p className="text-sm text-text-muted">Grupos lendo este livro agora. Qualquer um entra.</p>
      <ul className="flex flex-col gap-3">
        {reads.map((read) => (
          <li key={read.id}>
            <OpenReadRow read={read} signedIn={signedIn} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** One open read: who is in, how far, and "Entrar" (or "Abrir" when you are in). */
export function OpenReadRow({
  read,
  signedIn,
  showBook = false,
}: {
  read: OpenRead;
  signedIn: boolean;
  showBook?: boolean;
}) {
  const join = useJoinOpenRead();
  const navigate = useNavigate();
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border p-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {showBook && (
          <p className="truncate font-serif text-lg font-medium italic">{read.book.title}</p>
        )}
        <p className="flex items-center gap-2 text-sm text-text-muted">
          <AvatarStack people={read.members} />
          {membersLabel(
            read.members.map((member) => member.name),
            false,
          )}
        </p>
        <p className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
          {read.memberCount} {read.memberCount === 1 ? "leitor" : "leitores"} · grupo em{" "}
          {read.groupPercent}%{read.finishBy && ` · até ${formatFinishBy(read.finishBy)}`}
        </p>
      </div>
      {read.isMember ? (
        <Link
          to="/juntos/$id"
          params={{ id: read.id }}
          className="font-mono text-xs uppercase tracking-wider text-accent hover:opacity-80"
        >
          Abrir →
        </Link>
      ) : read.full ? (
        <span className="font-mono text-xs uppercase tracking-wider text-text-muted">Lotado</span>
      ) : signedIn ? (
        <Button
          variant="secondary"
          disabled={join.isPending}
          onClick={() =>
            join.mutate(read.id, {
              onSuccess: ({ id }) => void navigate({ to: "/juntos/$id", params: { id } }),
            })
          }
        >
          Entrar
        </Button>
      ) : (
        <Link
          to="/login"
          className="font-mono text-xs uppercase tracking-wider text-accent hover:opacity-80"
        >
          Entrar para ler junto
        </Link>
      )}
      {join.error && <p className="w-full text-sm text-danger">{errorMessage(join.error)}</p>}
    </div>
  );
}
