import {
  errorMessage,
  type ListDetail,
  useList,
  useMe,
  useRemoveFromList,
  useRemoveList,
  useUpdateList,
} from "@grimo/client";
import { bookCountLabel, firstIssue, listSchema, timeAgo } from "@grimo/core";
import { Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Spinner } from "@/components/feedback/spinner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BookCard } from "@/features/books";
import { ReportButton } from "@/features/moderation";

/** `/listas/<id>`: a reader's list, with its books and why each is there. */
export function ListView({ id, signedIn }: { id: string; signedIn: boolean }) {
  const list = useList(id);
  const me = useMe({ enabled: signedIn });
  const [editing, setEditing] = useState(false);

  if (list.isPending) return <Spinner />;
  if (!list.data) {
    return <p className="text-text-muted">Essa lista não existe mais.</p>;
  }
  const data = list.data;

  return (
    <div className="flex flex-col gap-8">
      {editing ? (
        <EditList list={data} onDone={() => setEditing(false)} />
      ) : (
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl leading-tight font-medium italic lg:text-4xl">{data.title}</h1>
          {data.description && (
            <p className="max-w-2xl whitespace-pre-line text-text-muted">{data.description}</p>
          )}
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-muted">
            <Avatar src={data.owner.image} name={data.owner.name} size="size-6" />
            <Link
              to="/u/$username"
              params={{ username: data.owner.username }}
              className="font-medium text-text hover:underline"
            >
              {data.owner.name}
            </Link>
            <span className="font-mono text-[11px] uppercase tracking-wider">
              {bookCountLabel(data.items.length)} · atualizada {timeAgo(new Date(data.updatedAt))}
            </span>
            {data.isMine ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="font-mono text-[11px] uppercase tracking-wider text-accent hover:opacity-80"
              >
                Editar
              </button>
            ) : (
              me.data && <ReportButton target="list" targetId={data.id} />
            )}
          </p>
        </header>
      )}

      {data.items.length === 0 ? (
        <p className="text-text-muted">
          {data.isMine
            ? "Lista vazia. Na página de qualquer livro, use “Adicionar a uma lista”."
            : "Essa lista ainda não tem livros."}
        </p>
      ) : (
        <ol className="grid grid-cols-2 gap-x-6 gap-y-8 @2xl/main:grid-cols-4 @5xl/main:grid-cols-6">
          {data.items.map((item, index) => (
            <li key={item.id} className="flex flex-col gap-2">
              <span className="font-mono text-[11px] text-text-muted">{index + 1}</span>
              <BookCard book={item.book}>
                {item.note && <p className="mt-1.5 text-xs text-text-muted">{item.note}</p>}
              </BookCard>
              {data.isMine && (
                <RemoveItem listId={data.id} openLibraryId={item.book.openLibraryId} />
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function RemoveItem({ listId, openLibraryId }: { listId: string; openLibraryId: string }) {
  const remove = useRemoveFromList();
  return (
    <button
      type="button"
      onClick={() => remove.mutate({ id: listId, openLibraryId })}
      className="w-fit font-mono text-[10px] uppercase tracking-wider text-text-muted hover:text-danger"
    >
      Tirar da lista
    </button>
  );
}

function EditList({ list, onDone }: { list: ListDetail; onDone: () => void }) {
  const update = useUpdateList();
  const remove = useRemoveList();
  const navigate = useNavigate();
  const [title, setTitle] = useState(list.title);
  const [description, setDescription] = useState(list.description);
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const input = listSchema.safeParse({ title, description });
    if (!input.success) return setError(firstIssue(input.error));
    update.mutate({ id: list.id, ...input.data }, { onSuccess: onDone });
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="flex flex-col gap-3 rounded-xl border border-border p-4"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={80}
        aria-label="Nome da lista"
        className="bg-transparent font-serif text-2xl italic outline-none"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder="Do que se trata (opcional)"
        aria-label="Descrição da lista"
        className="resize-none bg-transparent text-sm outline-none placeholder:text-text-muted"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={update.isPending}>
          Salvar
        </Button>
        <button
          type="button"
          onClick={onDone}
          className="font-mono text-xs uppercase tracking-wider text-text-muted hover:text-text"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => {
            if (!window.confirm("Apagar esta lista? Os livros continuam nas suas estantes.")) {
              return;
            }
            remove.mutate(list.id, {
              onSuccess: () =>
                void navigate({ to: "/u/$username", params: { username: list.owner.username } }),
              onError: (failure) => setError(errorMessage(failure)),
            });
          }}
          className="ml-auto font-mono text-xs uppercase tracking-wider text-danger hover:opacity-80"
        >
          Apagar lista
        </button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
