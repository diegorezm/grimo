import {
  errorMessage,
  type QueuedBook,
  type QueuedReport,
  useActOnReport,
  useDecideBook,
  useModerationQueue,
} from "@grimo/client";
import { REPORT_REASON_LABELS, type ReportTarget, timeAgo } from "@grimo/core";
import { Link } from "@tanstack/react-router";
import { Spinner } from "@/components/feedback/spinner";
import { Button } from "@/components/ui/button";

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
              <ReportItem key={report.id} report={report} />
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
    </div>
  );
}

function ReportItem({ report }: { report: QueuedReport }) {
  const act = useActOnReport();
  const run = (action: "dismiss" | "remove" | "suspend") => act.mutate({ report, action });
  const canRemove = report.target !== "user" && report.location !== null;

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
        {canRemove && (
          <Button onClick={() => run("remove")} disabled={act.isPending}>
            Remover conteúdo
          </Button>
        )}
        {report.targetUser && !report.targetUser.suspended && (
          <Button
            variant="ghost"
            className="text-danger"
            disabled={act.isPending}
            onClick={() => {
              if (
                window.confirm(`Suspender @${report.targetUser!.username}? A conta some do app.`)
              ) {
                run("suspend");
              }
            }}
          >
            Suspender leitor
          </Button>
        )}
      </div>
      {act.error && <p className="text-sm text-danger">{errorMessage(act.error)}</p>}
    </li>
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
