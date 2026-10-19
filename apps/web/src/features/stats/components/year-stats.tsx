import { useYearOverview } from "@grimo/client";
import { GENRE_LABELS, type Genre, goalProgress } from "@grimo/core";
import type { ReactNode } from "react";
import { BookOpenIcon, HeartIcon, PagesIcon } from "@/components/ui/icons";
import { Sparkle } from "@/components/ui/sparkle";

export type YearOverview = NonNullable<ReturnType<typeof useYearOverview>["data"]>;

/** The year in four tiles. Pass `stats` to show someone else's; defaults to the signed-in reader. */
export function YearStats({ stats }: { stats?: YearOverview }) {
  const own = useYearOverview();
  const data = stats ?? own.data;
  if (!data) return null;
  const goal = data.goal ? goalProgress(data.goal.target, data.goal.done) : null;
  const genre = data.topGenre ? (GENRE_LABELS[data.topGenre as Genre] ?? data.topGenre) : "—";

  return (
    <section
      aria-label={`Leituras de ${data.year}`}
      className="grid grid-cols-2 gap-3 xl:grid-cols-4"
    >
      <Tile
        icon={<BookOpenIcon />}
        tint="bg-shelf-read-bg text-shelf-read-fg"
        value={data.booksRead}
        label={`livros em ${data.year}`}
      />
      <Tile
        icon={<PagesIcon />}
        tint="bg-shelf-want-to-read-bg text-shelf-want-to-read-fg"
        value={data.pagesRead.toLocaleString("pt-BR")}
        label="páginas lidas"
      />
      <Tile
        icon={<HeartIcon />}
        tint="bg-shelf-reading-bg text-shelf-reading-fg"
        value={genre}
        label="gênero favorito"
      />
      <Tile
        icon={<Sparkle className="size-5" />}
        tint="bg-surface text-gold"
        value={goal ? `${goal.percent}%` : "—"}
        label={goal ? `da meta de ${goal.target}` : "sem meta"}
      />
    </section>
  );
}

function Tile({
  icon,
  tint,
  value,
  label,
}: {
  icon: ReactNode;
  tint: string;
  value: ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-lg border border-border p-4">
      <span className={`grid size-11 shrink-0 place-items-center rounded-md ${tint}`}>{icon}</span>
      <span className="min-w-0">
        <span className="block truncate font-serif text-xl font-medium">{value}</span>
        <span className="block truncate font-mono text-[11px] uppercase tracking-wider text-text-muted">
          {label}
        </span>
      </span>
    </div>
  );
}
