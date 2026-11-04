import {
  errorMessage,
  type ReportDetail,
  useActOnReport,
  useMe,
  useModerationReport,
} from "@grimo/client";
import {
  MAX_SUSPENSION_REASON,
  REPORT_REASON_LABELS,
  SUSPENSION_DURATION_LABELS,
  SUSPENSION_DURATIONS,
  type SuspensionDuration,
} from "@grimo/core";
import { Link, useNavigate } from "@tanstack/react-router";
import { type ReactNode, useCallback, useState } from "react";
import { Spinner } from "@/components/feedback/spinner";
import { ExpandIcon, SidePeek } from "@/components/layout/side-peek";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StaffBadge } from "@/components/ui/staff-badge";
import { cn } from "@/utils/cn";
import { ago, CHIP, LABEL, plural, TARGET_LABELS } from "./shared";

/**
 * One report in a side peek (`?report=<id>`): the reported thing as it is now, who wrote it and
 * their record, and every reporter, with the actions pinned at the bottom.
 */
export function ReportPeek({ reportId }: { reportId: string }) {
  const navigate = useNavigate();
  const detail = useModerationReport(reportId);
  const close = useCallback(
    () =>
      void navigate({
        to: ".",
        search: (prev) => ({ ...prev, report: undefined }),
        resetScroll: false,
      }),
    [navigate],
  );
  const report = detail.data;

  return (
    <SidePeek
      label="Denúncia"
      onClose={close}
      expand={report ? <OpenInApp report={report} /> : undefined}
      footer={report ? <Actions report={report} onDone={close} /> : undefined}
    >
      {report ? (
        <Body report={report} />
      ) : detail.isPending ? (
        <Spinner />
      ) : (
        <p className="py-10 text-center text-text-muted">
          Essa denúncia já foi resolvida (ou não existe mais).
        </p>
      )}
    </SidePeek>
  );
}

/** Link to the reported thing in the app, as the peek's "open as page" control. */
function OpenInApp({ report }: { report: ReportDetail }) {
  const content = report.content;
  const cls =
    "grid size-9 place-items-center rounded-md text-text-muted transition hover:bg-surface-muted hover:text-text";
  if (content?.postId) {
    return (
      <Link
        to="/posts/$id"
        params={{ id: content.postId }}
        aria-label="Abrir a publicação"
        title="Abrir a publicação"
        className={cls}
      >
        <ExpandIcon />
      </Link>
    );
  }
  if (content?.groupId) {
    return (
      <Link
        to="/juntos/$id"
        params={{ id: content.groupId }}
        aria-label="Abrir o grupo"
        title="Abrir o grupo"
        className={cls}
      >
        <ExpandIcon />
      </Link>
    );
  }
  if (report.targetUser) {
    return (
      <Link
        to="/u/$username"
        params={{ username: report.targetUser.username }}
        aria-label="Abrir o perfil"
        title="Abrir o perfil"
        className={cls}
      >
        <ExpandIcon />
      </Link>
    );
  }
  return null;
}

function Body({ report }: { report: ReportDetail }) {
  const user = report.targetUser;
  return (
    <div className="flex flex-col gap-7 pt-2">
      <header className="flex flex-col gap-3">
        <p className={LABEL}>Denúncia · {ago(report.createdAt)}</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn(CHIP, "border-border text-text-muted")}>
            {TARGET_LABELS[report.target]}
          </span>
          {report.reasons.map((reason) => (
            <span key={reason} className={cn(CHIP, "border-danger/40 text-danger")}>
              {REPORT_REASON_LABELS[reason]}
            </span>
          ))}
          {report.reportCount > 1 && (
            <span className={cn(CHIP, "border-accent text-accent")}>
              {report.reportCount} denúncias
            </span>
          )}
        </div>
      </header>

      <Section title="O que foi denunciado">
        <ReportedContent report={report} />
      </Section>

      {user && (
        <Section title="Quem foi denunciado">
          <div className="flex items-center gap-3">
            <Avatar src={user.image} name={user.name} size="size-12" />
            <div className="min-w-0">
              <Link
                to="/u/$username"
                params={{ username: user.username }}
                className="block truncate font-serif text-xl font-medium italic leading-tight hover:underline"
              >
                {user.name}
              </Link>
              <p className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-text-muted">
                @{user.username}
                <StaffBadge role={user.role} />
              </p>
            </div>
          </div>
          <AccountSummary user={user} />
        </Section>
      )}

      <Section
        title={report.reportCount > 1 ? `Denúncias (${report.reportCount})` : "Quem denunciou"}
      >
        <ul className="flex flex-col divide-y divide-border">
          {report.reporters.map((item) => (
            <li key={item.id} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                {item.reporter ? (
                  <span className="flex items-center gap-2">
                    <Avatar src={item.reporter.image} name={item.reporter.name} size="size-7" />
                    <strong className="font-semibold">@{item.reporter.username}</strong>
                  </span>
                ) : (
                  <span className="text-text-muted">conta excluída</span>
                )}
                <span className={cn(CHIP, "border-danger/40 text-danger")}>
                  {REPORT_REASON_LABELS[item.reason]}
                </span>
                <span className={LABEL}>{ago(item.createdAt)}</span>
              </p>
              {item.details && <p className="text-sm">“{item.details}”</p>}
              {item.reporter && (
                <p className={LABEL}>
                  conta criada {ago(item.reporter.joinedAt)} ·{" "}
                  {item.track.filed === 0
                    ? "primeira denúncia"
                    : `${plural(item.track.filed, "denúncia", "denúncias")}: ${plural(item.track.actioned, "acionada", "acionadas")}, ${plural(item.track.dismissed, "dispensada", "dispensadas")}`}
                </p>
              )}
            </li>
          ))}
        </ul>
        {report.moreReporters > 0 && (
          <p className={cn(LABEL, "mt-2")}>
            + {plural(report.moreReporters, "outra denúncia", "outras denúncias")}
          </p>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className={LABEL}>{title}</h3>
      {children}
    </section>
  );
}

/** The reported thing as it is now, with where and when. */
function ReportedContent({ report }: { report: ReportDetail }) {
  const content = report.content;
  if (!content) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-text-muted">O conteúdo já foi apagado.</p>
        {report.snapshot && (
          <blockquote className="rounded-md bg-surface-muted px-4 py-3 text-sm whitespace-pre-line">
            <span className={cn(LABEL, "mb-1 block")}>Cópia guardada na denúncia</span>
            {report.snapshot}
          </blockquote>
        )}
      </div>
    );
  }

  const facts: string[] = [];
  if (content.kind === "post") {
    facts.push(
      content.postKind === "review"
        ? "Resenha"
        : content.postKind === "update"
          ? "Comentário de leitura"
          : content.postKind === "quote"
            ? "Citação"
            : "Nota",
    );
    if (content.book) facts.push(content.book.title);
    if (content.rating) facts.push(`${content.rating} de 5`);
    facts.push(
      ago(content.createdAt),
      plural(content.likes, "curtida", "curtidas"),
      plural(content.comments, "comentário", "comentários"),
    );
  } else if (content.kind === "comment") {
    facts.push("Comentário", ago(content.createdAt));
  } else if (content.kind === "message") {
    facts.push("Mensagem no Juntos");
    if (content.bookTitle) facts.push(content.bookTitle);
    facts.push(
      `aos ${content.percent}% do livro`,
      ago(content.createdAt),
      ...(content.members ? [plural(content.members, "membro", "membros")] : []),
    );
  } else if (content.kind === "list") {
    facts.push("Lista", plural(content.items, "livro", "livros"), ago(content.createdAt));
  } else {
    facts.push("Perfil", `criado ${ago(content.createdAt)}`);
  }

  const edited =
    content.kind !== "user" &&
    report.snapshot !== null &&
    content.body !== null &&
    report.snapshot !== content.body;

  return (
    <div className="flex flex-col gap-2">
      <p className={cn(LABEL, "flex flex-wrap items-center gap-x-2")}>
        {facts.map((fact, index) => (
          <span key={`${index}-${fact}`}>
            {index > 0 && "· "}
            {fact}
          </span>
        ))}
        {content.kind === "post" && content.hasSpoilers && (
          <span className="text-danger">· marcado com spoiler</span>
        )}
      </p>
      {content.kind === "comment" && content.post && (
        <p className="rounded-md border border-border px-4 py-2 text-sm text-text-muted">
          Em resposta a{" "}
          {content.post.author ? `@${content.post.author.username}` : "uma conta excluída"}: “
          {content.post.snippet}”
        </p>
      )}
      <blockquote className="rounded-md bg-surface-muted px-4 py-3 text-sm whitespace-pre-line">
        {content.body ?? <span className="text-text-muted">Sem texto.</span>}
      </blockquote>
      {edited && report.snapshot && (
        <blockquote className="rounded-md border border-danger/40 px-4 py-3 text-sm whitespace-pre-line">
          <span className={cn(LABEL, "mb-1 block text-danger")}>
            O texto mudou desde a denúncia. Versão denunciada:
          </span>
          {report.snapshot}
        </blockquote>
      )}
    </div>
  );
}

/** Account age, size and the moderation record, so the moderator can see if it is a pattern. */
function AccountSummary({ user }: { user: NonNullable<ReportDetail["targetUser"]> }) {
  const record = user.history;
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <p className="text-text-muted">
        Conta criada {ago(user.joinedAt)} · {plural(user.bookCount, "livro", "livros")} ·{" "}
        {plural(user.followers, "seguidor", "seguidores")}
      </p>
      <p>
        {record && record.reports > 1 ? (
          <>
            <strong className="font-semibold">
              {plural(record.reports, "denúncia", "denúncias")} no total
            </strong>
            <span className="text-text-muted">
              {" "}
              · {plural(record.open, "aberta", "abertas")} ·{" "}
              {plural(record.actioned, "acionada", "acionadas")} ·{" "}
              {plural(record.dismissed, "dispensada", "dispensadas")}
            </span>
          </>
        ) : (
          <span className="text-text-muted">Sem denúncias anteriores.</span>
        )}
      </p>
      {record && (record.suspensions > 0 || record.removals > 0) && (
        <p className="text-text-muted">
          Já teve {plural(record.suspensions, "suspensão", "suspensões")} e{" "}
          {plural(record.removals, "remoção de conteúdo", "remoções de conteúdo")}.
        </p>
      )}
      {user.suspended && (
        <p className="text-danger">
          Suspenso{" "}
          {user.suspendedUntil
            ? `até ${new Date(user.suspendedUntil).toLocaleDateString("pt-BR")}`
            : "para sempre"}
          {user.suspendReason ? `: ${user.suspendReason}` : "."}
        </p>
      )}
    </div>
  );
}

/** Dismiss, remove or suspend; closes the peek when the server accepted it. */
function Actions({ report, onDone }: { report: ReportDetail; onDone: () => void }) {
  const act = useActOnReport();
  const isAdmin = useMe().data?.isAdmin ?? false;
  const [suspending, setSuspending] = useState(false);
  const user = report.targetUser;
  const canAct = user?.canAct !== false;
  const canRemove = report.target !== "user" && report.content !== null && canAct;
  const run = (input: {
    action: "dismiss" | "remove" | "suspend";
    duration?: SuspensionDuration;
    reason?: string;
  }) => act.mutate({ reportId: report.id, ...input }, { onSuccess: onDone });

  return (
    <div className="flex w-full flex-col gap-3">
      {suspending && user && (
        <SuspendForm
          username={user.username}
          isAdmin={isAdmin}
          pending={act.isPending}
          onCancel={() => setSuspending(false)}
          onSubmit={(duration, reason) => run({ action: "suspend", duration, reason })}
        />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          disabled={act.isPending}
          onClick={() => run({ action: "dismiss" })}
        >
          Dispensar
        </Button>
        {canRemove && (
          <Button disabled={act.isPending} onClick={() => run({ action: "remove" })}>
            Remover conteúdo
          </Button>
        )}
        {user && canAct && !user.suspended && !suspending && (
          <Button variant="ghost" className="text-danger" onClick={() => setSuspending(true)}>
            Suspender leitor
          </Button>
        )}
      </div>
      {user && !canAct && (
        <p className="text-sm text-text-muted">
          Essa conta é da moderação (ou é a sua): só dá para dispensar.
        </p>
      )}
      {act.error && <p className="text-sm text-danger">{errorMessage(act.error)}</p>}
    </div>
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
      className="flex flex-col gap-3 rounded-md border border-border bg-surface-muted/50 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(duration, reason.trim());
      }}
    >
      <p className="text-sm">
        Suspender <strong>@{username}</strong>: a conta some do app pelo tempo escolhido.
      </p>
      <fieldset className="flex flex-wrap gap-2">
        <legend className={cn(LABEL, "mb-2")}>Por quanto tempo</legend>
        {options.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={item === duration}
            onClick={() => setDuration(item)}
            className={cn(
              CHIP,
              "transition",
              item === duration
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-text-muted hover:text-text",
            )}
          >
            {SUSPENSION_DURATION_LABELS[String(item)]}
          </button>
        ))}
      </fieldset>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className={LABEL}>Motivo (a pessoa lê isso)</span>
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
