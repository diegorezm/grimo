import {
  errorMessage,
  type ModerationLogItem,
  type QueuedBook,
  type QueuedReport,
  useActOnReport,
  useDecideBook,
  useMe,
  useModerationLog,
  useModerationQueue,
} from "@grimo/client";
import {
  MAX_SUSPENSION_REASON,
  REPORT_REASON_LABELS,
  type ReportTarget,
  SUSPENSION_DURATION_LABELS,
  SUSPENSION_DURATIONS,
  type SuspensionDuration,
  timeAgo,
} from "@grimo/core";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Spinner } from "@/components/feedback/spinner";
import { Button } from "@/components/ui/button";
import { ModerationTeam } from "./moderation-team";

const TARGET_LABELS: Record<ReportTarget, string> = {
  post: "Publicação",
  comment: "Comentário",
  user: "Leitor",
  message: "Mensagem no Juntos",
};

/**
 * `/admin`: the moderation queue. Open reports (oldest first) with what was reported and who
 * wrote it, and the books readers added by hand waiting to become public.
 */
export function ModerationPanel() {
  const queue = useModerationQueue();
  const isAdmin = useMe().data?.isAdmin ?? false;
  if (queue.isPending) return <Spinner />;
  if (queue.error) {
    return <p className="rounded-xl bg-surface-muted p-6">{errorMessage(queue.error)}</p>;
  }
  const { reports, books } = queue.data;

  return (
    <div className="flex flex-col gap-12">
      <section aria-labelledby="reports-title" className="flex flex-col gap-4">
        <h2 id="reports-title" className="text-2xl font-medium italic">
          Denúncias abertas <span className="font-mono text-base">({reports.length})</span>
        </h2>
        {reports.length === 0 ? (
          <p className="text-text-muted">Nenhuma denúncia esperando.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {reports.map((report) => (
              <ReportItem key={report.id} report={report} isAdmin={isAdmin} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="books-title" className="flex flex-col gap-4">
        <h2 id="books-title" className="text-2xl font-medium italic">
          Livros cadastrados <span className="font-mono text-base">({books.length})</span>
        </h2>
        <p className="text-sm text-text-muted">
          Aprovado, o livro aparece na busca de todo mundo. Recusado, continua só na estante de quem
          cadastrou.
        </p>
        {books.length === 0 ? (
          <p className="text-text-muted">Nenhum livro esperando revisão.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {books.map((book) => (
              <BookItem key={book.openLibraryId} book={book} />
            ))}
          </ul>
        )}
      </section>

      {isAdmin && <ModerationTeam />}

      {isAdmin && <ModerationHistory />}
    </div>
  );
}

function ReportItem({ report, isAdmin }: { report: QueuedReport; isAdmin: boolean }) {
  const act = useActOnReport();
  const [suspending, setSuspending] = useState(false);
  const run = (action: "dismiss" | "remove") => act.mutate({ report, action });
  const canRemove = report.target !== "user" && report.location !== null;
  const canAct = report.targetUser?.canAct !== false;

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border p-5">
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-text-muted">
        <span className="text-text">{TARGET_LABELS[report.target]}</span>
        <span className="text-danger">{REPORT_REASON_LABELS[report.reason]}</span>
        <span>{timeAgo(new Date(report.createdAt))}</span>
        {report.reporter && <span>por @{report.reporter.username}</span>}
      </p>
      {report.details && <p className="text-sm">“{report.details}”</p>}
      {report.snapshot && (
        <blockquote className="rounded-md bg-surface-muted px-4 py-3 text-sm whitespace-pre-line">
          {report.snapshot}
        </blockquote>
      )}
      <p className="flex flex-wrap items-center gap-x-3 text-sm text-text-muted">
        {report.targetUser && (
          <>
            De{" "}
            <Link
              to="/u/$username"
              params={{ username: report.targetUser.username }}
              className="font-semibold text-text hover:underline"
            >
              {report.targetUser.name} (@{report.targetUser.username})
            </Link>
            {report.targetUser.suspended && <span className="text-danger">já suspenso</span>}
          </>
        )}
        {report.location?.postId && (
          <Link
            to="."
            search={(prev) => ({ ...prev, post: report.location!.postId! })}
            className="font-semibold text-accent hover:underline"
          >
            Ver publicação
          </Link>
        )}
        {report.location === null && <span>O conteúdo já foi apagado.</span>}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => run("dismiss")} disabled={act.isPending}>
          Dispensar
        </Button>
        {canRemove && canAct && (
          <Button onClick={() => run("remove")} disabled={act.isPending}>
            Remover conteúdo
          </Button>
        )}
        {report.targetUser && canAct && !report.targetUser.suspended && !suspending && (
          <Button
            variant="ghost"
            className="text-danger"
            disabled={act.isPending}
            onClick={() => setSuspending(true)}
          >
            Suspender leitor
          </Button>
        )}
      </div>
      {report.targetUser && !canAct && (
        <p className="text-sm text-text-muted">
          Essa conta é da moderação (ou é a sua): só dá para dispensar.
        </p>
      )}
      {suspending && report.targetUser && (
        <SuspendForm
          username={report.targetUser.username}
          isAdmin={isAdmin}
          pending={act.isPending}
          onCancel={() => setSuspending(false)}
          onSubmit={(duration, reason) =>
            act.mutate({ report, action: "suspend", duration, reason })
          }
        />
      )}
      {act.error && <p className="text-sm text-danger">{errorMessage(act.error)}</p>}
    </li>
  );
}

function SuspendForm({
  username,
  isAdmin,
  pending,
  onCancel,
  onSubmit,
}: {
  username: string;
  isAdmin: boolean;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (duration: SuspensionDuration, reason: string) => void;
}) {
  const [duration, setDuration] = useState<SuspensionDuration>(7);
  const [reason, setReason] = useState("");
  const options = SUSPENSION_DURATIONS.filter((item) => isAdmin || item !== "permanent");

  return (
    <form
      noValidate
      className="flex flex-col gap-3 rounded-md border border-border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(duration, reason.trim());
      }}
    >
      <p className="text-sm">
        Suspender <strong>@{username}</strong>: a conta some do app pelo tempo escolhido.
      </p>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
          Por quanto tempo
        </span>
        <select
          value={String(duration)}
          onChange={(event) => {
            const value = event.target.value;
            setDuration(value === "permanent" ? "permanent" : (Number(value) as 1 | 7 | 30));
          }}
          className="w-fit rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        >
          {options.map((item) => (
            <option key={item} value={String(item)}>
              {SUSPENSION_DURATION_LABELS[String(item)]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
          Motivo (a pessoa lê isso)
        </span>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={MAX_SUSPENSION_REASON}
          rows={3}
          className="w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
      </label>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending || reason.trim() === ""}>
          Suspender
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

const LOG_LABELS: Record<ModerationLogItem["action"], string> = {
  dismiss: "dispensou",
  remove: "removeu conteúdo de",
  suspend: "suspendeu",
  unsuspend: "reabilitou",
  book_approve: "aprovou o livro",
  book_reject: "recusou o livro",
  role_grant: "deu o papel a",
  role_revoke: "tirou o papel de",
};

/** Admins only: the last moderation actions, newest first. */
function ModerationHistory() {
  const log = useModerationLog();
  return (
    <section aria-labelledby="log-title" className="flex flex-col gap-4">
      <h2 id="log-title" className="text-2xl font-medium italic">
        Histórico
      </h2>
      {log.isPending ? (
        <Spinner />
      ) : log.error ? (
        <p className="text-text-muted">{errorMessage(log.error)}</p>
      ) : log.data.items.length === 0 ? (
        <p className="text-text-muted">Nenhuma ação ainda.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {log.data.items.map((item) => (
            <li key={item.id} className="py-3 text-sm">
              <span className="font-semibold">
                {item.actor ? `@${item.actor.username}` : "CLI"}
              </span>{" "}
              {LOG_LABELS[item.action]}{" "}
              {item.targetUser ? (
                <span className="font-semibold">@{item.targetUser.username}</span>
              ) : (
                item.targetId && <span className="font-mono text-xs">{item.targetId}</span>
              )}
              {item.details && <span className="text-text-muted"> · {item.details}</span>}
              <span className="font-mono text-[11px] text-text-muted">
                {" "}
                · {timeAgo(new Date(item.createdAt))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function BookItem({ book }: { book: QueuedBook }) {
  const decide = useDecideBook();
  return (
    <li className="flex flex-wrap items-center gap-4 py-4 first:pt-0">
      <div className="min-w-0 flex-1">
        <p className="font-serif text-lg font-medium">{book.title}</p>
        <p className="text-sm text-text-muted">
          {book.authors.join(", ")}
          {book.publishedYear && ` · ${book.publishedYear}`}
          {book.pageCount && ` · ${book.pageCount} páginas`}
        </p>
        <p className="font-mono text-[11px] text-text-muted">
          {book.addedBy ? `@${book.addedBy.username}` : "conta excluída"} ·{" "}
          {timeAgo(new Date(book.addedAt))}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => decide.mutate({ openLibraryId: book.openLibraryId, approve: true })}
          disabled={decide.isPending}
        >
          Aprovar
        </Button>
        <Button
          variant="ghost"
          onClick={() => decide.mutate({ openLibraryId: book.openLibraryId, approve: false })}
          disabled={decide.isPending}
        >
          Recusar
        </Button>
      </div>
    </li>
  );
}
