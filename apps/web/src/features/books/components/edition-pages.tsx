import { errorMessage, useUpdateShelfEntry } from "@grimo/client";
import { firstIssue, updateShelfEntrySchema } from "@grimo/core";
import { type FormEvent, useState } from "react";

/**
 * "Sua edição: 412 páginas": editions differ, so each reader can set their own page count
 * (progress, "faltam N páginas" and finishing use it). Empty goes back to the book's.
 */
export function EditionPages({
  entryId,
  pageCount,
  bookPages,
}: {
  entryId: string;
  /** Your edition's pages, if you set them. */
  pageCount: number | null;
  /** The book's pages (Open Library), if known. */
  bookPages: number | null;
}) {
  const update = useUpdateShelfEntry();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pages = pageCount ?? bookPages;

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = String(new FormData(event.currentTarget).get("pages") ?? "").trim();
    const value = raw === "" || Number(raw) === bookPages ? null : Number(raw);
    const parsed = updateShelfEntrySchema.shape.pageCount.safeParse(value);
    if (!parsed.success) return setError(firstIssue(parsed.error));
    setError(null);
    setEditing(false);
    if (value !== pageCount) {
      update.mutate(
        { id: entryId, pageCount: value },
        { onError: (failure) => setError(errorMessage(failure)) },
      );
    }
  }

  if (editing) {
    return (
      <form noValidate onSubmit={save} className="flex flex-wrap items-center gap-2 text-sm">
        <label htmlFor="edition-pages" className="text-text-muted">
          Páginas da sua edição
        </label>
        <input
          // biome-ignore lint/a11y/noAutofocus: opened by clicking "Alterar"
          autoFocus
          id="edition-pages"
          name="pages"
          type="number"
          inputMode="numeric"
          min={1}
          defaultValue={pages ?? ""}
          placeholder={bookPages ? String(bookPages) : "páginas"}
          className="w-24 rounded-md border border-border bg-surface px-2 py-1 font-mono outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="font-mono text-[11px] uppercase tracking-wider text-accent hover:opacity-80"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="font-mono text-[11px] uppercase tracking-wider text-text-muted hover:text-text"
        >
          Cancelar
        </button>
        {error ? (
          <span role="alert" className="w-full text-xs text-danger">
            {error}
          </span>
        ) : (
          bookPages && (
            <span className="w-full text-xs text-text-muted">
              Deixe vazio para usar as {bookPages} páginas do livro.
            </span>
          )
        )}
      </form>
    );
  }

  return (
    <p className="flex flex-wrap items-center gap-x-2 text-sm text-text-muted">
      {pages ? `Sua edição: ${pages} páginas` : "Quantas páginas tem a sua edição?"}
      {pageCount !== null && bookPages && <span>(o livro: {bookPages})</span>}
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="font-mono text-[11px] uppercase tracking-wider text-accent hover:opacity-80"
      >
        {pages ? "Alterar" : "Informar"}
      </button>
      {error && (
        <span role="alert" className="w-full text-danger">
          {error}
        </span>
      )}
    </p>
  );
}
