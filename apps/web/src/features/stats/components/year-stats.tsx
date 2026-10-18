import { useYearOverview } from "@grimo/client";
import { GENRE_LABELS, type Genre, goalProgress } from "@grimo/core";
import { Card } from "@/components/ui/card";

export function YearStats() {
  const { data } = useYearOverview();
  if (!data) return null;
  const goal = data.goal ? goalProgress(data.goal.target, data.goal.done) : null;

  return (
    <Card className="grid grid-cols-3 gap-4 text-center">
      <Stat label="livros lidos" value={data.booksRead} />
      <Stat label="páginas" value={data.pagesRead} />
      <Stat
        label="gênero favorito"
        value={data.topGenre ? (GENRE_LABELS[data.topGenre as Genre] ?? data.topGenre) : "—"}
      />
      {goal && (
        <div className="col-span-3 flex flex-col gap-1 text-left">
          <p className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
            Meta {data.year}: {goal.done}/{goal.target} livros
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
            <div className="h-full bg-accent" style={{ width: `${goal.percent}%` }} />
          </div>
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="truncate font-mono text-2xl font-semibold">{value}</p>
      <p className="font-mono text-[11px] uppercase tracking-wider text-text-muted">{label}</p>
    </div>
  );
}
