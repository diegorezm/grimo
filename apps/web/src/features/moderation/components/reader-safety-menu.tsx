import { errorMessage, useSetBlocked } from "@grimo/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ReportDialog } from "./report-dialog";

/** "⋯" on a reader's page: report or block (unblock when already blocked). */
export function ReaderSafetyMenu({
  reader,
  blocked,
}: {
  reader: { id: string; name: string };
  blocked: boolean;
}) {
  const setBlocked = useSetBlocked();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<"report" | "block" | null>(null);
  const openDialog = (which: "report" | "block") => {
    setOpen(false);
    setDialog(which);
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Mais opções"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="grid size-10 place-items-center rounded-full border border-border bg-surface text-text-muted shadow-sm shadow-shadow transition hover:text-text"
      >
        ⋯
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 flex w-48 flex-col rounded-md border border-border bg-surface py-1 text-sm shadow-lg">
          <MenuItem onClick={() => openDialog("report")}>Denunciar</MenuItem>
          {blocked ? (
            <MenuItem
              onClick={() => {
                setOpen(false);
                setBlocked.mutate({ userId: reader.id, block: false });
              }}
            >
              Desbloquear
            </MenuItem>
          ) : (
            <MenuItem danger onClick={() => openDialog("block")}>
              Bloquear
            </MenuItem>
          )}
        </div>
      )}
      {dialog === "report" && (
        <ReportDialog target="user" targetId={reader.id} onClose={() => setDialog(null)} />
      )}
      {dialog === "block" && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-border bg-surface p-6 text-left shadow-xl"
          >
            <h2 className="text-2xl font-medium italic">Bloquear {reader.name}?</h2>
            <p className="text-text-muted">
              Vocês deixam de se seguir e não verão nem poderão interagir com o que o outro publica.{" "}
              {reader.name} não é avisado. Dá para desbloquear depois em Conta e privacidade.
            </p>
            {setBlocked.error && (
              <p className="text-sm text-danger">{errorMessage(setBlocked.error)}</p>
            )}
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  setBlocked.mutate(
                    { userId: reader.id, block: true },
                    { onSuccess: () => setDialog(null) },
                  )
                }
                disabled={setBlocked.isPending}
              >
                Bloquear
              </Button>
              <Button variant="ghost" onClick={() => setDialog(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  onClick,
  danger = false,
  children,
}: {
  onClick: () => void;
  danger?: boolean;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        danger
          ? "px-4 py-2 text-left text-danger hover:bg-surface-muted"
          : "px-4 py-2 text-left hover:bg-surface-muted"
      }
    >
      {children}
    </button>
  );
}
