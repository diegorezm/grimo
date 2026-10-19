import { useMonthlySummary } from "@grimo/client";
import { GENRE_LABELS, type Genre } from "@grimo/core";
import { storyCard } from "@grimo/tokens";
import { toBlob } from "html-to-image";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Sparkle } from "@/components/ui/sparkle";

const SCALE = 0.3;

const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

/**
 * "Resumo do mês" card at Instagram Stories size (1080×1920), shown scaled down.
 * Exported as PNG and shared via the Web Share API (falls back to download).
 */
export function MonthlyCard({ month }: { month?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { data } = useMonthlySummary(month);
  if (!data) return null;

  async function share() {
    if (!ref.current) return;
    const blob = await toBlob(ref.current, { pixelRatio: 1, style: { transform: "none" } });
    if (!blob) return;
    const file = new File([blob], `grimo-${data!.month}.png`, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "Meu mês de leitura" });
      return;
    }
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const genre = data.topGenre ? (GENRE_LABELS[data.topGenre as Genre] ?? data.topGenre) : "—";

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        style={{ width: storyCard.width * SCALE, height: storyCard.height * SCALE }}
        className="overflow-hidden rounded-xl shadow-lg"
      >
        <div
          ref={ref}
          style={{
            width: storyCard.width,
            height: storyCard.height,
            transform: `scale(${SCALE})`,
            transformOrigin: "top left",
          }}
          className="relative flex flex-col justify-between overflow-hidden bg-surface p-24 text-text [background-image:radial-gradient(70rem_50rem_at_100%_0%,var(--color-glow-a),transparent_70%),radial-gradient(70rem_50rem_at_0%_100%,var(--color-glow-b),transparent_70%)]"
        >
          <Sparkle className="absolute top-28 right-28 size-20" />
          <Sparkle className="absolute top-[52%] right-40 size-10 fill-accent" />
          <div>
            <p className="font-mono text-4xl uppercase tracking-[0.2em] text-text-muted">
              Meu mês de leitura
            </p>
            <p className="mt-6 font-serif text-9xl font-medium italic first-letter:uppercase">
              {monthLabel.format(new Date(`${data.month}-15T12:00:00`))}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-12">
            <Big value={data.booksRead} label="livros" />
            <Big value={data.pagesRead} label="páginas" />
            <Big value={genre} label="gênero mais lido" />
            {data.goal && <Big value={`${data.goal.percent}%`} label="da meta anual" />}
          </div>
          {data.favoriteBook && (
            <div className="flex items-center gap-10">
              {data.favoriteBook.coverUrl && (
                <img
                  src={data.favoriteBook.coverUrl}
                  alt=""
                  crossOrigin="anonymous"
                  className="h-96 rounded-lg shadow-2xl shadow-shadow"
                />
              )}
              <div>
                <p className="font-mono text-3xl uppercase tracking-[0.2em] text-text-muted">
                  Livro favorito
                </p>
                <p className="mt-3 font-serif text-7xl font-medium italic">
                  {data.favoriteBook.title}
                </p>
              </div>
            </div>
          )}
          <p className="font-serif text-6xl italic">✦ grimo</p>
        </div>
      </div>
      <Button onClick={share}>Compartilhar card</Button>
    </div>
  );
}

function Big({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <p className="font-serif text-9xl font-medium text-accent">{value}</p>
      <p className="mt-2 font-mono text-3xl uppercase tracking-[0.15em] text-text-muted">{label}</p>
    </div>
  );
}
