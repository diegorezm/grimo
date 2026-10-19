const monthShort = Array.from({ length: 12 }, (_, i) =>
  new Intl.DateTimeFormat("pt-BR", { month: "short" })
    .format(new Date(2026, i, 15))
    .replace(".", ""),
);
const monthLong = Array.from({ length: 12 }, (_, i) =>
  new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(2026, i, 15)),
);

/**
 * Books finished per month as a single-series column chart. The current month is the solid
 * accent; past months a lighter step of it. Hover (or focus) a column for its count.
 */
export function ReadingRhythm({ counts, year }: { counts: number[]; year: number }) {
  const max = Math.max(1, ...counts);
  const now = new Date();
  const current = now.getFullYear() === year ? now.getMonth() : -1;
  const total = counts.reduce((sum, n) => sum + n, 0);

  return (
    <section
      aria-labelledby="rhythm-title"
      className="flex flex-col gap-5 rounded-xl border border-border p-6"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="rhythm-title" className="text-2xl font-medium italic">
          Ritmo de {year}
        </h2>
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
          {total} {total === 1 ? "livro" : "livros"}
        </span>
      </div>

      <ul className="flex h-44 items-end gap-1.5 border-b border-border sm:gap-2">
        {counts.map((count, month) => {
          const future = current >= 0 && month > current;
          return (
            <li key={monthShort[month]} className="flex h-full flex-1">
              <button
                type="button"
                aria-label={`${monthLong[month]}: ${count} ${count === 1 ? "livro" : "livros"}`}
                className="group relative flex h-full w-full cursor-default flex-col items-center justify-end outline-none"
              >
                {/* Tooltip, anchored inward at the edges so it never leaves the chart. */}
                <span
                  className={`pointer-events-none absolute -top-2 z-10 -translate-y-full whitespace-nowrap rounded-md bg-inverse px-2.5 py-1 text-xs text-inverse-foreground opacity-0 shadow-md transition group-hover:opacity-100 group-focus-visible:opacity-100 ${month < 2 ? "left-0" : month > 9 ? "right-0" : "left-1/2 -translate-x-1/2"}`}
                >
                  {count} em {monthLong[month]}
                </span>
                {count > 0 && (
                  <span className="mb-1 font-mono text-[11px] text-text-muted">{count}</span>
                )}
                <span
                  className={
                    month === current
                      ? "w-full rounded-t-[4px] bg-accent"
                      : future
                        ? "w-full rounded-t-[4px] bg-surface-muted"
                        : "w-full rounded-t-[4px] bg-accent/45 group-hover:bg-accent/70"
                  }
                  style={{ height: count > 0 ? `${(count / max) * 80}%` : future ? "0" : "3px" }}
                />
              </button>
            </li>
          );
        })}
      </ul>
      <div className="-mt-3 flex gap-1.5 sm:gap-2" aria-hidden="true">
        {monthShort.map((label, month) => (
          <span
            key={label}
            className={`flex-1 text-center font-mono text-[10px] uppercase ${month === current ? "text-text" : "text-text-muted"}`}
          >
            {label.slice(0, 3)}
          </span>
        ))}
      </div>
    </section>
  );
}
