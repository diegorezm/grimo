import {
  errorMessage,
  type MyShelf,
  toast,
  useCreateShelf,
  useDuplicateShelf,
  useRenameShelf,
} from "@grimo/client";
import { copyName, firstIssue, shelfNameSchema } from "@grimo/core";
import { type ReactNode, useState } from "react";
import { NameDialog } from "@/components/ui";

type Ask =
  | { kind: "new"; entryIds: string[]; onDone?: (id: string) => void }
  | { kind: "rename"; shelf: MyShelf }
  | { kind: "duplicate"; shelf: MyShelf; onDone?: (id: string) => void };

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
  const [error, setError] = useState<string | null>(null);
  const create = useCreateShelf();
  const rename = useRenameShelf();
  const duplicate = useDuplicateShelf();
  const close = () => {
    setAsk(null);
    setError(null);
  };

  function submit(rawName: string, isPublic: boolean) {
    if (!ask) return;
    const parsed = shelfNameSchema.safeParse(rawName);
    if (!parsed.success) return setError(firstIssue(parsed.error));
    const name = parsed.data;
    const onError = (failure: unknown) => setError(errorMessage(failure));
    if (ask.kind === "new") {
      create.mutate(
        { name, isPublic, entryIds: ask.entryIds },
        {
          onSuccess: ({ id }) => {
            const count = ask.entryIds.length;
            toast.saved(
              count > 0
                ? `Estante ${name} criada com ${count} ${count === 1 ? "livro" : "livros"}`
                : `Estante ${name} criada`,
            );
            ask.onDone?.(id);
            close();
          },
          onError,
        },
      );
    } else if (ask.kind === "rename") {
      rename.mutate(
        { id: ask.shelf.id, name },
        {
          onSuccess: () => {
            toast.saved(`Agora se chama ${name}`);
            close();
          },
          onError,
        },
      );
    } else {
      duplicate.mutate(
        { id: ask.shelf.id, name },
        {
          onSuccess: ({ id }) => {
            toast.saved(`Cópia criada: ${name}. Tire os livros que não quiser.`);
            ask.onDone?.(id);
            close();
          },
          onError,
        },
      );
    }
  }

  const titles = { new: "Nova estante", rename: "Renomear estante", duplicate: "Duplicar estante" };
  const confirm = { new: "Criar", rename: "Salvar", duplicate: "Duplicar" };
  const dialog = (
    <NameDialog
      visible={ask !== null}
      title={ask ? titles[ask.kind] : ""}
      initialName={
        ask?.kind === "rename"
          ? ask.shelf.name
          : ask?.kind === "duplicate"
            ? copyName(ask.shelf.name)
            : ""
      }
      placeholder="Física, Kindle, Emprestei…"
      confirmLabel={ask ? confirm[ask.kind] : ""}
      askPublic={ask?.kind === "new"}
      initialPublic={false}
      pending={create.isPending || rename.isPending || duplicate.isPending}
      error={error}
      onSubmit={submit}
      onClose={close}
    />
  );

  return {
    dialog,
    askNew: (entryIds = [], onDone) => setAsk({ kind: "new", entryIds, onDone }),
    askRename: (shelf) => setAsk({ kind: "rename", shelf }),
    askDuplicate: (shelf, onDone) => setAsk({ kind: "duplicate", shelf, onDone }),
  };
}
