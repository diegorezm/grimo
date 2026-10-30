import { useMe, useModerationCounts } from "@grimo/client";
import { useState } from "react";
import { cn } from "@/utils/cn";
import { BookReviewList } from "./book-review-list";
import { ModerationHistory } from "./moderation-history";
import { ModerationTeam } from "./moderation-team";
import { ReportList } from "./report-list";

type Tab = "reports" | "books" | "team" | "history";

/**
 * `/admin`: tabs like the shelves page. Everyone on the team works the report queue and reviews
 * hand-added books; admins also manage the team and read the history.
 */
export function ModerationPanel() {
  const isAdmin = useMe().data?.isAdmin ?? false;
  const counts = useModerationCounts().data;
  const [tab, setTab] = useState<Tab>("reports");

  const count = (n: number | undefined) =>
    n === undefined ? "…" : n >= (counts?.cap ?? 100) ? `${n - 1}+` : String(n);
  const tabs: { id: Tab; label: string; hint: string }[] = [
    {
      id: "reports",
      label: "Denúncias",
      hint: `${count(counts?.reports)} ${counts?.reports === 1 ? "aberta" : "abertas"}`,
    },
    {
      id: "books",
      label: "Livros",
      hint: `${count(counts?.books)} para revisar`,
    },
    ...(isAdmin
      ? [
          { id: "team" as const, label: "Equipe", hint: "moderadores e convites" },
          { id: "history" as const, label: "Histórico", hint: "ações da moderação" },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label="Moderação"
        className={cn("grid grid-cols-2 gap-3", isAdmin && "@2xl/main:grid-cols-4")}
      >
        {tabs.map((item) => {
          const active = item.id === tab;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={active}
              aria-controls={`panel-${item.id}`}
              onClick={() => setTab(item.id)}
              className={cn(
                "flex flex-col gap-1 rounded-lg border p-4 text-left transition",
                active
                  ? "border-edge bg-surface-muted shadow-sm shadow-shadow"
                  : "border-transparent hover:bg-surface-muted/60",
              )}
            >
              <span className="font-serif text-lg font-medium">{item.label}</span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
                {item.hint}
              </span>
            </button>
          );
        })}
      </div>

      <section role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "reports" && <ReportList />}
        {tab === "books" && <BookReviewList />}
        {tab === "team" && isAdmin && <ModerationTeam />}
        {tab === "history" && isAdmin && <ModerationHistory />}
      </section>
    </div>
  );
}
