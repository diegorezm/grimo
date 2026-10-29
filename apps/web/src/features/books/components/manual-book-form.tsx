import { errorMessage, useAddManualBook } from "@grimo/client";
import {
  firstIssue,
  manualBookSchema,
  SHELF_LABELS,
  SHELF_STATUSES,
  type ShelfStatus,
  splitAuthors,
} from "@grimo/core";
import { useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const optionalNumber = (value: FormDataEntryValue | null) => {
  const text = String(value ?? "").trim();
  return text === "" ? null : Number(text);
};

/**
 * "Cadastrar livro" for what Open Library doesn't have (Brazilian and independent books). It goes
 * on your shelf at once; others see it after moderation approves it.
 */
export function ManualBookForm({
  initialTitle = "",
  onCancel,
}: {
  initialTitle?: string;
  onCancel: () => void;
}) {
  const add = useAddManualBook();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ShelfStatus>("reading");
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = manualBookSchema.safeParse({
      title: String(form.get("title") ?? ""),
      authors: splitAuthors(String(form.get("authors") ?? "")),
      pageCount: optionalNumber(form.get("pageCount")),
      publishedYear: optionalNumber(form.get("publishedYear")),
    });
    if (!input.success) return setError(firstIssue(input.error));
    setError(null);
    add.mutate(
      { ...input.data, status },
      {
        onSuccess: ({ openLibraryId }) =>
          navigate({ to: "/books/$openLibraryId", params: { openLibraryId } }),
        onError: (failure) => setError(errorMessage(failure)),
      },
    );
  }

  return (
    <form
      noValidate
      onSubmit={submit}
      className="flex max-w-xl flex-col gap-4 rounded-xl border border-border p-5"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-medium italic">Cadastrar livro</h2>
        <p className="text-sm text-text-muted">
          Ele entra na sua estante agora. Para os outros leitores, aparece depois que a gente
          revisar (para manter o catálogo limpo).
        </p>
      </div>
      <Input name="title" placeholder="Título" defaultValue={initialTitle} aria-label="Título" />
      <Input name="authors" placeholder="Autor (separe vários por vírgula)" aria-label="Autor" />
      <div className="grid grid-cols-2 gap-3">
        <Input
          name="pageCount"
          type="number"
          inputMode="numeric"
          placeholder="Páginas"
          aria-label="Páginas"
        />
        <Input
          name="publishedYear"
          type="number"
          inputMode="numeric"
          placeholder="Ano"
          aria-label="Ano de publicação"
        />
      </div>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-2 font-mono text-[11px] uppercase tracking-wider text-text-muted">
          Estante
        </legend>
        {SHELF_STATUSES.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={status === option}
            onClick={() => setStatus(option)}
            className={
              status === option
                ? "bg-accent-gradient rounded-full px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-accent-foreground"
                : "rounded-full border border-border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-text-muted hover:text-text"
            }
          >
            {SHELF_LABELS[option]}
          </button>
        ))}
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={add.isPending}>
          Cadastrar
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
