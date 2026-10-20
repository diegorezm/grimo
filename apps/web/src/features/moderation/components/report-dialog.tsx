import { errorMessage, type ReportInput, useReport } from "@grimo/client";
import {
  firstIssue,
  REPORT_REASON_LABELS,
  REPORT_REASONS,
  type ReportReason,
  type ReportTarget,
  reportSchema,
} from "@grimo/core";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

const TITLES: Record<ReportTarget, string> = {
  post: "Denunciar publicação",
  comment: "Denunciar comentário",
  user: "Denunciar leitor",
};

/** "Denunciar" link that opens the report dialog for a post, comment or reader. */
export function ReportButton({
  target,
  targetId,
  className,
  label = "Denunciar",
}: {
  target: ReportTarget;
  targetId: string;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("hover:text-danger", className)}
      >
        {label}
      </button>
      {open && <ReportDialog target={target} targetId={targetId} onClose={() => setOpen(false)} />}
    </>
  );
}

/** Pick a reason (and say more when it's "other"); validated with the core `reportSchema`. */
export function ReportDialog({
  target,
  targetId,
  onClose,
}: {
  target: ReportTarget;
  targetId: string;
  onClose: () => void;
}) {
  const report = useReport();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!reason) return setError("Escolha um motivo");
    const input: ReportInput = { target, targetId, reason, details };
    const parsed = reportSchema.safeParse({ ...input, details: details.trim() || undefined });
    if (!parsed.success) return setError(firstIssue(parsed.error));
    setError(null);
    report.mutate(input, { onError: (failure) => setError(errorMessage(failure)) });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        className="w-full max-w-md rounded-xl border border-border bg-surface p-6 text-left text-text shadow-xl"
      >
        {report.isSuccess ? (
          <div className="flex flex-col gap-4">
            <h2 id="report-title" className="text-2xl font-medium italic">
              Obrigado por avisar
            </h2>
            <p className="text-text-muted">
              Vamos analisar a denúncia. Se quiser parar de ver essa pessoa, você também pode
              bloqueá-la no perfil dela.
            </p>
            <Button className="self-start" onClick={onClose}>
              Fechar
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            <h2 id="report-title" className="text-2xl font-medium italic">
              {TITLES[target]}
            </h2>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm text-text-muted">Qual é o problema?</legend>
              {REPORT_REASONS.filter((r) => target === "user" || r !== "underage").map((r) => (
                <label key={r} className="flex items-center gap-2.5 text-sm">
                  <input
                    type="radio"
                    name="reason"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-accent"
                  />
                  {REPORT_REASON_LABELS[r]}
                </label>
              ))}
            </fieldset>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={reason === "other" ? "Conte o que aconteceu" : "Detalhes (opcional)"}
              rows={3}
              maxLength={1000}
              className="rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm outline-none placeholder:text-text-muted focus:border-accent"
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={report.isPending}>
                {report.isPending ? "Enviando…" : "Enviar denúncia"}
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
