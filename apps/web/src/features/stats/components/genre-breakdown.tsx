import { GENRE_LABELS, type Genre } from "@grimo/core";

/** Most read genres as labeled horizontal bars (single hue; the label carries identity). */
export function GenreBreakdown({ genres }: { genres: { genre: string; count: number }[] }) {
  const max = Math.max(1, ...genres.map((g) => g.count));

  return (
    <section
      aria-labelledby="genres-title"
      className="flex flex-col gap-5 rounded-xl border border-border p-6"
    >
      <h2 id="genres-title" className="text-2xl font-medium italic">
        O que você mais lê
      </h2>
      {genres.length === 0 ? (
        <p className="text-sm text-text-muted">Termine alguns livros para ver seus gêneros aqui.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {genres.map(({ genre, count }) => (
            <li key={genre} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium">
                  {GENRE_LABELS[genre as Genre] ?? genre}
                </span>
                <span className="font-mono text-xs text-text-muted">
                  {count} {count === 1 ? "livro" : "livros"}
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
