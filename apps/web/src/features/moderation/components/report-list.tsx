import { errorMessage, type QueuedReport, useModerationReports } from "@grimo/client";
import {
  REPORT_REASON_LABELS,
  REPORT_REASONS,
  REPORT_TARGETS,
  type ReportReason,
  type ReportTarget,
} from "@grimo/core";
import { Link, useSearch } from "@tanstack/react-router";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/feedback/spinner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StaffBadge } from "@/components/ui/staff-badge";
import { cn } from "@/utils/cn";
import { Card, CardBanner, CardGrid } from "./card-grid";
import { SearchField, SelectField } from "./filters";
import { Pager } from "./pager";
import { ago, CHIP, LABEL, peekSearch, TARGET_LABELS } from "./shared";

const SORT_OPTIONS = [
  { value: "oldest", label: "Mais antigas primeiro" },
  { value: "newest", label: "Mais recentes primeiro" },
  { value: "most", label: "Mais denunciadas" },
] as const;

/**
 * Open reports as short cards (who, what kind, the start of the text); a click opens the whole
 * investigation in a side peek. Search, filters, sort and numbered pages.
 */
export function ReportList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState<ReportReason | "">("");
  const [target, setTarget] = useState<ReportTarget | "">("");
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]["value"]>("oldest");
  const top = useRef<HTMLDivElement>(null);
  const query = useDeferredValue(search.trim());
  const filtered = Boolean(query || reason || target);
  const open = useSearch({ strict: false }).report;

  const reports = useModerationReports(page, {
    reason: reason || undefined,
    target: target || undefined,
    sort,
    search: query,
  });
  const data = reports.data;

  // The server clamps the page (the last reports of a page may have been dealt with).
  useEffect(() => {
    if (data && !reports.isPlaceholderData && data.page !== page) setPage(data.page);
  }, [data, reports.isPlaceholderData, page]);

  const narrow =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value);
      setPage(1);
    };
  const go = (next: number) => {
    setPage(next);
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const clear = () => {
    setSearch("");
    setReason("");
    setTarget("");
    setPage(1);
  };

  return (
    <div ref={top} className="flex scroll-mt-4 flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <SearchField
          value={search}
          onChange={narrow(setSearch)}
          placeholder="Buscar por @, nome ou texto denunciado"
          label="Buscar denúncias"
          className="flex-1 basis-64"
        />
        <SelectField
          label="Motivo"
          placeholder="Todos os motivos"
          value={reason}
          onChange={narrow(setReason)}
          options={REPORT_REASONS.map((value) => ({ value, label: REPORT_REASON_LABELS[value] }))}
        />
        <SelectField
          label="Tipo"
          placeholder="Todos os tipos"
          value={target}
          onChange={narrow(setTarget)}
          options={REPORT_TARGETS.map((value) => ({ value, label: TARGET_LABELS[value] }))}
        />
        <SelectField
          label="Ordem"
          value={sort}
          onChange={(value) => {
            setSort(value === "" ? "oldest" : value);
            setPage(1);
          }}
          options={SORT_OPTIONS}
        />
      </div>

      {reports.isPending ? (
        <Spinner />
      ) : reports.error ? (
        <p className="rounded-xl bg-surface-muted p-6 text-text-muted">
          {errorMessage(reports.error)}
        </p>
      ) : !data || data.items.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-xl bg-surface-muted p-6 text-text-muted">
          <p>
            {filtered
              ? "Nenhuma denúncia com esses filtros."
              : "Nenhuma denúncia esperando. Quando alguém denunciar algo, aparece aqui."}
          </p>
          {filtered && (
            <Button variant="secondary" onClick={clear}>
              Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <>
          <CardGrid>
            {data.items.map((report) => (
              <ReportCard key={report.id} report={report} selected={report.id === open} />
            ))}
          </CardGrid>
          <Pager
            page={data.page}
            pages={data.pages}
            total={data.total}
            capped={data.capped}
            onPage={go}
          />
        </>
      )}
    </div>
  );
}

/** The basics of a report as a small profile card; the whole card opens it in the side peek. */
function ReportCard({ report, selected }: { report: QueuedReport; selected: boolean }) {
  const user = report.targetUser;
  return (
    <Card selected={selected}>
      <CardBanner
        left={TARGET_LABELS[report.target]}
        right={report.reportCount > 1 ? `${report.reportCount} denúncias` : undefined}
      />
      <div className="flex flex-1 flex-col gap-3 px-5 pb-5">
        <Avatar
          src={user?.image ?? null}
          name={user?.name ?? "?"}
          size="size-14"
          className="relative -mt-7 bg-accent-gradient text-accent-foreground shadow-md ring-4 ring-surface"
        />
        <div className="min-w-0">
          {user ? (
            <Link
              to="."
              search={peekSearch({ report: report.id })}
              resetScroll={false}
              aria-current={selected ? "true" : undefined}
              className="block truncate font-serif text-xl font-medium italic leading-tight after:absolute after:inset-0 after:rounded-lg group-hover:underline"
            >
              {user.name}
            </Link>
          ) : (
            <Link
              to="."
              search={peekSearch({ report: report.id })}
              resetScroll={false}
              className="block font-serif text-xl italic leading-tight text-text-muted after:absolute after:inset-0 after:rounded-lg"
            >
              Conta excluída
            </Link>
          )}
          {user && (
            <p className="flex items-center gap-2 truncate font-mono text-[11px] text-text-muted">
              @{user.username}
              <StaffBadge role={user.role} />
              {user.suspended && <span className="text-danger">suspenso</span>}
            </p>
          )}
        </div>

        <p className="line-clamp-3 min-h-[3.75rem] text-sm leading-snug text-text-muted">
          {report.snippet ?? "Sem texto."}
        </p>

        <div className="flex flex-wrap gap-2">
          {report.reasons.slice(0, 2).map((reason) => (
            <span key={reason} className={cn(CHIP, "border-danger/40 text-danger")}>
              {REPORT_REASON_LABELS[reason]}
            </span>
          ))}
          {report.reasons.length > 2 && (
            <span className={cn(CHIP, "border-danger/40 text-danger")}>
              +{report.reasons.length - 2}
            </span>
          )}
        </div>

        <p
          className={cn(
            LABEL,
            "mt-auto flex items-center justify-between border-t border-border pt-4",
          )}
        >
          <span>{ago(report.createdAt)}</span>
          <span className="text-accent">Investigar →</span>
        </p>
      </div>
    </Card>
  );
}
