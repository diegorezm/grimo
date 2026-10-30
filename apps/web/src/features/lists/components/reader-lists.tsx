import { errorMessage, type ListTile, useCreateList, useReaderLists } from "@grimo/client";
import { bookCountLabel, firstIssue, listSchema } from "@grimo/core";
import { Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { BookCover } from "@/features/books";

/** "Listas" on a profile: the reader's curated lists, and "Nova lista" on your own. */
export function ReaderLists({ username, isMe }: { username: string; isMe: boolean }) {
  const lists = useReaderLists(username).data?.items ?? [];
  const [creating, setCreating] = useState(false);
  if (lists.length === 0 && !isMe) return null;

  return (
    <section aria-labelledby="lists-title" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="lists-title" className="text-2xl font-medium italic">
          Listas
        </h2>
        {isMe && !creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="font-mono text-[11px] uppercase tracking-wider text-accent hover:opacity-80"
          >
            + Nova lista
          </button>
        )}
      </div>
      {creating && <NewListForm onDone={() => setCreating(false)} />}
      {lists.length === 0 ? (
        <p className="text-sm text-text-muted">
          Junte livros num tema: “terror para começar”, “melhores do ano”…
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 @2xl/main:grid-cols-2">
          {lists.map((list) => (
            <li key={list.id}>
              <ListCard list={list} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ListCard({ list }: { list: ListTile }) {
  return (
    <Link
      to="/listas/$id"
      params={{ id: list.id }}
      className="flex items-center gap-4 rounded-xl border border-border p-4 transition hover:border-accent/50"
    >
      <span className="flex shrink-0 -space-x-6">
        {list.covers.length === 0 ? (
          <span className="grid aspect-[2/3] w-12 place-items-center rounded-sm bg-surface-muted" />
        ) : (
          list.covers.map((cover) => (
            <BookCover
              key={cover.title}
              src={cover.coverUrl}
              title={cover.title}
              className="w-12 shadow-md shadow-shadow"
            />
          ))
        )}
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="truncate font-serif text-lg font-medium italic">{list.title}</span>
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
          {bookCountLabel(list.itemCount)}
        </span>
      </span>
    </Link>
  );
}

/** Name and description of a new list; it opens right after. */
export function NewListForm({ onDone }: { onDone: () => void }) {
  const create = useCreateList();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const input = listSchema.safeParse({ title, description });
    if (!input.success) return setError(firstIssue(input.error));
    create.mutate(input.data, {
      onSuccess: ({ id }) => {
        onDone();
        void navigate({ to: "/listas/$id", params: { id } });
      },
      onError: (failure) => setError(errorMessage(failure)),
    });
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="flex flex-col gap-3 rounded-xl border border-border p-4"
    >
      <input
        // biome-ignore lint/a11y/noAutofocus: opened by clicking "Nova lista"
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={80}
        placeholder="Nome da lista"
        aria-label="Nome da lista"
        className="bg-transparent font-serif text-lg italic outline-none placeholder:text-text-muted"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder="Do que se trata (opcional)"
        aria-label="Descrição da lista"
        className="resize-none bg-transparent text-sm outline-none placeholder:text-text-muted"
      />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={create.isPending}>
          Criar lista
        </Button>
        <button
          type="button"
          onClick={onDone}
          className="font-mono text-xs uppercase tracking-wider text-text-muted hover:text-text"
        >
          Cancelar
        </button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
