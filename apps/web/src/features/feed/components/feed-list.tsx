import { type FeedTab, useFeed } from "@grimo/client";
import { groupActivities } from "@grimo/core";
import { Link } from "@tanstack/react-router";
import { Spinner } from "@/components/feedback/spinner";
import { LoadMore } from "@/components/ui/load-more";
import { cn } from "@/utils/cn";
import { FeedItem } from "./feed-item";

const TABS: { id: FeedTab; label: string; hint: string }[] = [
  { id: "following", label: "Seguindo", hint: "você e quem você segue" },
  { id: "community", label: "Comunidade", hint: "todo mundo no Grimo" },
];

/** `/feed`: the "Seguindo" and "Comunidade" tabs over a column of activity cards. */
export function FeedTimeline({
  tab,
  onTabChange,
}: {
  tab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
}) {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div role="tablist" aria-label="Feed" className="grid grid-cols-2 gap-3">
        {TABS.map((item) => {
          const active = item.id === tab;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`feed-tab-${item.id}`}
              aria-selected={active}
              aria-controls="feed-panel"
              onClick={() => onTabChange(item.id)}
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
      <section role="tabpanel" id="feed-panel" aria-labelledby={`feed-tab-${tab}`}>
        {/* One list per tab, so each keeps its own page size. */}
        <FeedList key={tab} tab={tab} onShowCommunity={() => onTabChange("community")} />
      </section>
    </div>
  );
}

function FeedList({ tab, onShowCommunity }: { tab: FeedTab; onShowCommunity: () => void }) {
  const feed = useFeed(tab);
  const items = feed.data?.items ?? [];
  const groups = groupActivities(items);

  if (feed.isPending) return <Spinner />;
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center text-sm text-text-muted">
        {tab === "following" ? (
          <>
            <p>Ninguém por aqui ainda. Siga leitores para ver o que estão lendo.</p>
            <div className="flex gap-4 font-mono text-[11px] uppercase tracking-wider">
              <button type="button" onClick={onShowCommunity} className="text-accent">
                Ver a comunidade →
              </button>
              <Link to="/people" className="text-accent">
                Encontrar leitores →
              </Link>
            </div>
          </>
        ) : (
          <p>Nada no Grimo ainda. Que tal começar marcando o que você está lendo?</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map(({ id, items: [item, ...more] }) => (
        <FeedItem key={id} item={item!} more={more} />
      ))}
      <LoadMore {...feed} />
    </div>
  );
}
