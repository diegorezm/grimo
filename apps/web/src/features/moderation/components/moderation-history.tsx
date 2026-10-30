import {
  errorMessage,
  type LogAction,
  type ModerationLogItem,
  useModerationLog,
} from "@grimo/client";
import { timeAgo } from "@grimo/core";
import { useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/feedback/spinner";
import { Avatar } from "@/components/ui/avatar";
import { SelectField } from "./filters";
import { Pager } from "./pager";

const LOG_LABELS: Record<ModerationLogItem["action"], string> = {
  dismiss: "dispensou uma denúncia sobre",
  remove: "removeu conteúdo de",
  suspend: "suspendeu",
  unsuspend: "reabilitou",
  book_approve: "aprovou o livro",
  book_reject: "recusou o livro",
  role_grant: "deu um papel a",
  role_revoke: "tirou um papel de",
};

const ACTION_FILTERS: readonly { value: LogAction; label: string }[] = [
  { value: "dismiss", label: "Denúncias dispensadas" },
  { value: "remove", label: "Conteúdos removidos" },
  { value: "suspend", label: "Suspensões" },
  { value: "unsuspend", label: "Reabilitações" },
  { value: "book_approve", label: "Livros aprovados" },
  { value: "book_reject", label: "Livros recusados" },
  { value: "role_grant", label: "Papéis concedidos" },
  { value: "role_revoke", label: "Papéis retirados" },
];

/** Admins only: every moderation action, newest first, filterable by kind, in numbered pages. */
export function ModerationHistory() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<LogAction | "">("");
  const top = useRef<HTMLDivElement>(null);
  const log = useModerationLog(page, action || undefined);
  const data = log.data;

  useEffect(() => {
    if (data && !log.isPlaceholderData && data.page !== page) setPage(data.page);
  }, [data, log.isPlaceholderData, page]);

  return (
    <div ref={top} className="flex scroll-mt-4 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <SelectField
          label="Tipo de ação"
          placeholder="Todas as ações"
          value={action}
          onChange={(value) => {
            setAction(value);
            setPage(1);
          }}
          options={ACTION_FILTERS}
        />
      </div>
      {log.isPending ? (
        <Spinner />
      ) : log.error ? (
        <p className="rounded-xl bg-surface-muted p-6 text-text-muted">{errorMessage(log.error)}</p>
      ) : !data || data.items.length === 0 ? (
        <p className="rounded-xl bg-surface-muted p-6 text-text-muted">
          {action
            ? "Nenhuma ação desse tipo."
            : "Nenhuma ação ainda. Remoções, suspensões e mudanças na equipe ficam registradas aqui."}
        </p>
      ) : (
        <>
          <ul className="flex flex-col divide-y divide-border">
            {data.items.map((item) => (
              <li key={item.id} className="flex items-start gap-3 py-4">
                {item.actor ? (
                  <Avatar src={item.actor.image} name={item.actor.name} size="size-8" />
                ) : (
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-muted font-mono text-[10px] text-text-muted">
                    CLI
                  </span>
                )}
                <div className="min-w-0 flex-1 text-sm">
                  <p>
                    <strong className="font-semibold">
                      {item.actor ? `@${item.actor.username}` : "Linha de comando"}
                    </strong>{" "}
                    {LOG_LABELS[item.action]}{" "}
                    {item.targetUser ? (
                      <strong className="font-semibold">@{item.targetUser.username}</strong>
                    ) : (
                      item.targetId && <span className="font-mono text-xs">{item.targetId}</span>
                    )}
                  </p>
                  {item.details && <p className="text-text-muted">{item.details}</p>}
                  <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-text-muted">
                    {timeAgo(new Date(item.createdAt))}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <Pager
            page={data.page}
            pages={data.pages}
            total={data.total}
            capped={data.capped}
            onPage={(next) => {
              setPage(next);
              top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
        </>
      )}
    </div>
  );
}
