import {
  errorMessage,
  useFriendsWant,
  useGroups,
  useJoinGroup,
  useOpenRecent,
} from "@grimo/client";
import { friendsWantLabel, membersLabel, parseInviteCode } from "@grimo/core";
import { Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Spinner } from "@/components/feedback/spinner";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { Button } from "@/components/ui/button";
import { formatFinishBy } from "@/components/ui/finish-picker";
import { BookCard, BookCover, BookPeekLink, OpenReadRow } from "@/features/books";

/** The Juntos tab: your groups, a box for an invite code, and ideas when there are none. */
export function GroupList() {
  const groups = useGroups();
  if (groups.isPending) return <Spinner />;
  const items = groups.data?.items ?? [];

  return (
    <div className="flex flex-col gap-10">
      {items.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 @3xl/main:grid-cols-2">
          {items.map((group) => (
            <li key={group.id}>
              <Link
                to="/juntos/$id"
                params={{ id: group.id }}
                className="flex gap-4 rounded-xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:border-accent/50"
              >
                <BookCover src={group.book.coverUrl} title={group.book.title} className="w-16" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <p className="line-clamp-2 font-serif text-lg font-medium leading-snug">
                    {group.book.title}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-text-muted">
                    <AvatarStack people={group.others} />
                    {membersLabel(
                      group.others.map((member) => member.name),
                      true,
                    )}
                  </p>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
                    Você {group.myPercent}% · grupo {group.groupPercent}%
                    {group.finishBy && ` · até ${formatFinishBy(group.finishBy)}`}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="max-w-2xl rounded-xl bg-surface-muted p-6 text-text-muted">
          Nenhum grupo ainda. Abra um livro e toque em <strong>Ler com alguém</strong>, ou entre com
          o link que um amigo mandou. Cada um vê o progresso de todos, e a conversa abre conforme
          você lê.
        </p>
      )}
      <JoinByCode />
      <OpenRecent />
      <Ideas />
    </div>
  );
}

/** "Entre numa leitura": open reads of any book you can join now (for those without friends here). */
function OpenRecent() {
  const reads = useOpenRecent().data?.items ?? [];
  if (reads.length === 0) return null;
  return (
    <section aria-labelledby="open-recent" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="open-recent" className="text-2xl font-medium italic">
          Entre numa leitura
        </h2>
        <p className="text-sm text-text-muted">
          Leituras abertas: qualquer leitor entra, sem convite.
        </p>
      </div>
      <ul className="grid grid-cols-1 gap-3 @3xl/main:grid-cols-2">
        {reads.map((read) => (
          <li key={read.id}>
            <OpenReadRow read={read} signedIn showBook />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Paste an invite link (or just its code) to join. */
function JoinByCode() {
  const join = useJoinGroup();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = parseInviteCode(String(new FormData(event.currentTarget).get("code") ?? ""));
    if (!code) return setError("Cole o link do convite ou o código de 8 letras.");
    setError(null);
    join.mutate(code, {
      onSuccess: ({ id }) => navigate({ to: "/juntos/$id", params: { id } }),
      onError: (failure) => setError(errorMessage(failure)),
    });
  }

  return (
    <form noValidate onSubmit={submit} className="flex max-w-xl flex-col gap-2">
      <label htmlFor="invite-code" className="text-xl font-medium italic">
        Recebeu um convite?
      </label>
      <div className="flex gap-2">
        <input
          id="invite-code"
          name="code"
          autoComplete="off"
          placeholder="Link ou código do convite"
          className="min-w-0 flex-1 rounded-full border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-accent"
        />
        <Button type="submit" disabled={join.isPending}>
          Entrar
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}

/** Books the people you follow want to read: each one is a group waiting to happen. */
function Ideas() {
  const items = (useFriendsWant().data?.items ?? []).slice(0, 6);
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="ideas-title" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="ideas-title" className="text-xl font-medium italic">
          Que tal ler junto?
        </h2>
        <p className="text-sm text-text-muted">
          Livros que quem você segue quer ler. Abra um e toque em “Ler com alguém”.
        </p>
      </div>
      <ul className="-mx-1 flex snap-x gap-7 overflow-x-auto px-1 pt-1 pb-5 [scrollbar-width:none]">
        {items.map(({ book, friends }) => (
          <li key={book.id} className="w-32 shrink-0 snap-start">
            <BookCard book={book}>
              <BookPeekLink
                openLibraryId={book.openLibraryId}
                className="mt-2 flex flex-col gap-1.5 text-xs text-text-muted"
              >
                <AvatarStack people={friends} />
                {friendsWantLabel(friends.map((friend) => friend.name))}
              </BookPeekLink>
            </BookCard>
          </li>
        ))}
      </ul>
    </section>
  );
}
