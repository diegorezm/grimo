import {
  errorMessage,
  type MyShelf,
  toast,
  useCreateShelf,
  useDuplicateShelf,
  useRenameShelf,
} from "@grimo/client";
import { copyName, firstIssue, MAX_SHELF_NAME, shelfNameSchema } from "@grimo/core";
import { type FormEvent, type ReactNode, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Ask =
  | { kind: "new"; entryIds: string[]; onDone?: (id: string) => void }
  | { kind: "rename"; shelf: MyShelf }
  | { kind: "duplicate"; shelf: MyShelf; onDone?: (id: string) => void };

const TITLES = { new: "Nova estante", rename: "Renomear estante", duplicate: "Duplicar estante" };
const CONFIRM = { new: "Criar", rename: "Salvar", duplicate: "Duplicar" };

/**
 * Naming a shelf: "Nova estante" (with books already picked), "Renomear" and "Duplicar". Render
 * `dialog` once; call `ask…` from any button.
 */
export function useShelfNaming(): {
  dialog: ReactNode;
  askNew: (entryIds?: string[], onDone?: (id: string) => void) => void;
  askRename: (shelf: MyShelf) => void;
  askDuplicate: (shelf: MyShelf, onDone?: (id: string) => void) => void;
} {
  const [ask, setAsk] = useState<Ask | null>(null);
  return {
    dialog: ask && <NamingDialog key={ask.kind} ask={ask} onClose={() => setAsk(null)} />,
    askNew: (entryIds = [], onDone) => setAsk({ kind: "new", entryIds, onDone }),
    askRename: (shelf) => setAsk({ kind: "rename", shelf }),
    askDuplicate: (shelf, onDone) => setAsk({ kind: "duplicate", shelf, onDone }),
  };
}

function NamingDialog({ ask, onClose }: { ask: Ask; onClose: () => void }) {
  const [name, setName] = useState(
    ask.kind === "rename"
      ? ask.shelf.name
      : ask.kind === "duplicate"
        ? copyName(ask.shelf.name)
        : "",
  );
  const [isPublic, setIsPublic] = useState(false);
  const nameId = useId();
  const [error, setError] = useState<string | null>(null);
  const create = useCreateShelf();
  const rename = useRenameShelf();
  const duplicate = useDuplicateShelf();
  const pending = create.isPending || rename.isPending || duplicate.isPending;

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = shelfNameSchema.safeParse(name);
    if (!parsed.success) return setError(firstIssue(parsed.error));
    const value = parsed.data;
    const onError = (failure: unknown) => setError(errorMessage(failure));
    if (ask.kind === "new") {
      create.mutate(
        { name: value, isPublic, entryIds: ask.entryIds },
        {
          onSuccess: ({ id }) => {
            const count = ask.entryIds.length;
            toast.saved(
              count > 0
                ? `Estante ${value} criada com ${count} ${count === 1 ? "livro" : "livros"}`
                : `Estante ${value} criada`,
            );
            ask.onDone?.(id);
            onClose();
          },
          onError,
        },
      );
    } else if (ask.kind === "rename") {
      rename.mutate(
        { id: ask.shelf.id, name: value },
        {
          onSuccess: () => {
            toast.saved(`Agora se chama ${value}`);
            onClose();
          },
          onError,
        },
      );
    } else {
      duplicate.mutate(
        { id: ask.shelf.id, name: value },
        {
          onSuccess: ({ id }) => {
            toast.saved(`Cópia criada: ${value}. Tire os livros que não quiser.`);
            ask.onDone?.(id);
            onClose();
          },
          onError,
        },
      );
    }
  }

  return (
    <Dialog title={TITLES[ask.kind]} onClose={onClose}>
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={nameId}
            className="font-mono text-[10px] tracking-[0.12em] text-text-muted uppercase"
          >
            Nome
          </label>
          <Input
            value={name}
            onChange={(event) => {
              setError(null);
              setName(event.target.value);
            }}
            maxLength={MAX_SHELF_NAME}
            placeholder="Física, Kindle, Emprestei…"
            id={nameId}
          />
        </div>
        {ask.kind === "new" && (
          <div className="relative grid grid-cols-2 rounded-full bg-surface-muted p-1">
            <span
              aria-hidden="true"
              className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-surface shadow-sm shadow-shadow transition-transform duration-300"
              style={{ transform: isPublic ? "none" : "translateX(100%)" }}
            />
            {[
              { value: true, label: "Aparece no perfil" },
              { value: false, label: "Só eu vejo" },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                aria-pressed={isPublic === option.value}
                onClick={() => setIsPublic(option.value)}
                className="relative min-h-10 font-mono text-[11px] tracking-wider uppercase"
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {CONFIRM[ask.kind]}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
