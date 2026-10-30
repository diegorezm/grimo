import {
  errorMessage,
  useAddToList,
  useCreateList,
  useMyLists,
  useRemoveFromList,
} from "@grimo/client";
import { type BookInput, firstIssue, listSchema } from "@grimo/core";
import { Link } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";

/** "Adicionar a uma lista" on a book page: tick the lists the book goes on. */
export function AddToList({ book }: { book: BookInput }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Button variant="secondary" className="w-fit" onClick={() => setOpen(true)}>
        Adicionar a uma lista
      </Button>
    );
  }
  return <ListPicker book={book} onClose={() => setOpen(false)} />;
}

function ListPicker({ book, onClose }: { book: BookInput; onClose: () => void }) {
  const lists = useMyLists(book.openLibraryId).data?.items;
  const add = useAddToList();
  const remove = useRemoveFromList();
  const [creating, setCreating] = useState(false);

  return (
    <section
      aria-labelledby="add-to-list"
      className="flex flex-col gap-3 rounded-xl border border-border p-5"
    >
      <div className="flex items-center justify-between">
        <h2 id="add-to-list" className="text-xl font-medium italic">
          Suas listas
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="font-mono text-xs uppercase tracking-wider text-text-muted hover:text-text"
        >
          Fechar
        </button>
      </div>
      {lists?.length === 0 && !creating && (
        <p className="text-sm text-text-muted">Você ainda não tem listas.</p>
      )}
      <ul className="flex flex-col gap-1">
        {lists?.map((list) => (
          <li key={list.id} className="flex items-center gap-3">
            <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-surface-muted">
              <input
                type="checkbox"
                checked={list.hasBook}
                onChange={(e) =>
                  e.target.checked
                    ? add.mutate({ id: list.id, book })
                    : remove.mutate({ id: list.id, openLibraryId: book.openLibraryId })
                }
              />
              <span className="flex-1 truncate">{list.title}</span>
              <span className="font-mono text-[11px] text-text-muted">{list.itemCount}</span>
            </label>
            <Link
              to="/listas/$id"
              params={{ id: list.id }}
              className="font-mono text-[11px] uppercase tracking-wider text-text-muted hover:text-accent"
            >
              Ver
            </Link>
          </li>
        ))}
      </ul>
      {creating ? (
        <QuickList book={book} onDone={() => setCreating(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="w-fit font-mono text-[11px] uppercase tracking-wider text-accent hover:opacity-80"
        >
          + Nova lista
        </button>
      )}
    </section>
  );
}

/** A new list with just its name, the book already on it. */
function QuickList({ book, onDone }: { book: BookInput; onDone: () => void }) {
  const create = useCreateList();
  const add = useAddToList();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const input = listSchema.safeParse({ title });
    if (!input.success) return setError(firstIssue(input.error));
    create.mutate(input.data, {
      onSuccess: ({ id }) => add.mutate({ id, book }, { onSuccess: onDone }),
      onError: (failure) => setError(errorMessage(failure)),
    });
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          // biome-ignore lint/a11y/noAutofocus: opened by clicking "Nova lista"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          placeholder="Nome da lista"
          aria-label="Nome da nova lista"
          className="min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent"
        />
        <Button type="submit" disabled={create.isPending || add.isPending}>
          Criar
        </Button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
