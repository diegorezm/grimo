import { useMonthlySummary } from "@grimo/client";
import { GENRE_LABELS, type Genre } from "@grimo/core";
import { storyCard } from "@grimo/tokens";
import { toBlob } from "html-to-image";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

const SCALE = 0.3;

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
          className="flex flex-col justify-between bg-inverse p-24 text-inverse-foreground"
        >
          <div>
            <p className="text-5xl opacity-80">Meu mês de leitura</p>
            <p className="font-serif text-8xl font-bold">{data.month}</p>
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
                  className="h-96 rounded-lg"
                />
              )}
              <div>
                <p className="text-4xl opacity-80">Livro favorito</p>
                <p className="font-serif text-6xl font-bold">{data.favoriteBook.title}</p>
              </div>
            </div>
          )}
          <p className="font-serif text-5xl">grimo</p>
        </div>
      </div>
      <Button onClick={share}>Compartilhar card</Button>
    </div>
  );
}

function Big({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <p className="font-serif text-9xl font-bold">{value}</p>
      <p className="text-4xl opacity-80">{label}</p>
    </div>
  );
}
