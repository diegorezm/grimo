import { type BookSearchResult, errorMessage, useCreateGroup } from "@grimo/client";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FinishPicker, finishByFor } from "@/components/ui/finish-picker";
import { TogetherIcon } from "@/components/ui/icons";

/**
 * "Ler com alguém" on a book: pick when to finish (optional), create the group, then invite
 * people from the group page.
 */
export function StartGroup({ book }: { book: BookSearchResult }) {
  const create = useCreateGroup();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState<number | null>(30);
  const [openRead, setOpenRead] = useState(false);

  function start() {
    create.mutate(
      { book, finishBy: finishByFor(days), open: openRead },
      { onSuccess: ({ id }) => navigate({ to: "/juntos/$id", params: { id } }) },
    );
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)} className="w-fit">
        <TogetherIcon className="size-4" />
        Ler com alguém
      </Button>
    );
  }
  return (
    <section
      aria-labelledby="start-group"
      className="flex flex-col gap-4 rounded-xl border border-border p-5"
    >
      <div className="flex flex-col gap-1">
        <h2 id="start-group" className="text-xl font-medium italic">
          Ler com alguém
        </h2>
        <p className="text-sm text-text-muted">
          Você cria o grupo e manda o link. Cada um vê o progresso de todos, e a conversa abre
          conforme você lê: ninguém leva spoiler.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
          Terminar em
        </span>
        <FinishPicker days={days} onChange={setDays} />
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={openRead}
          onChange={(e) => setOpenRead(e.target.checked)}
          className="mt-1"
        />
        <span>
          <span className="font-medium">Leitura aberta</span>
          <span className="block text-text-muted">
            Aparece na página do livro e no Juntos: qualquer leitor pode entrar, sem convite.
          </span>
        </span>
      </label>
      {create.error && (
        <p role="alert" className="text-sm text-danger">
          {errorMessage(create.error)}
        </p>
      )}
      <div className="flex gap-2">
        <Button onClick={start} disabled={create.isPending}>
          Criar grupo
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </section>
  );
}
