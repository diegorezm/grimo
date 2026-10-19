import { useYearOverview } from "@grimo/client";
import { GENRE_LABELS, type Genre, goalProgress } from "@grimo/core";
import { Sparkle } from "@/components/ui/sparkle";

export type YearOverview = NonNullable<ReturnType<typeof useYearOverview>["data"]>;

/**
 * The year in numbers, with the reading goal underneath. Pass `stats` to show someone else's;
 * defaults to the signed-in reader.
 */
export function YearStats({ stats }: { stats?: YearOverview }) {
  const own = useYearOverview();
  const data = stats ?? own.data;
  if (!data) return null;
  const goal = data.goal ? goalProgress(data.goal.target, data.goal.done) : null;
  const genre = data.topGenre ? (GENRE_LABELS[data.topGenre as Genre] ?? data.topGenre) : "—";

  const numbers = [
    { value: data.booksRead, label: "livros lidos" },
    { value: data.pagesRead.toLocaleString("pt-BR"), label: "páginas" },
    { value: genre, label: "gênero do ano" },
    { value: goal ? `${goal.percent}%` : "—", label: goal ? "da meta" : "sem meta" },
  ];

  return (
    <section
      aria-labelledby="year-title"
      className="flex flex-col gap-6 rounded-xl border border-border p-6 sm:p-7"
    >
      <h2
        id="year-title"
        className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted"
      >
        {data.year} em números
      </h2>
      <dl className="grid grid-cols-2 gap-y-6 md:grid-cols-4 md:divide-x md:divide-border">
        {numbers.map(({ value, label }) => (
          <div key={label} className="flex flex-col-reverse gap-1 md:px-6 md:first:pl-0">
            <dt className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
              {label}
            </dt>
            <dd className="truncate font-serif text-4xl font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      {goal && (
        <div className="flex flex-col gap-2">
          <div className="relative h-2.5 rounded-full bg-surface-muted">
            <div
              className="bg-accent-gradient h-full rounded-full"
              style={{ width: `${goal.percent}%` }}
            />
            <Sparkle
              className="absolute -top-1.5 size-5.5"
              style={{ left: `calc(${goal.percent}% - 11px)` }}
            />
          </div>
          <p className="text-sm text-text-muted">
            <strong className="text-text">{goal.done}</strong> de {goal.target} livros
            {goal.done < goal.target ? ` · faltam ${goal.target - goal.done}` : " · meta batida ✦"}
          </p>
        </div>
      )}
    </section>
  );
}
