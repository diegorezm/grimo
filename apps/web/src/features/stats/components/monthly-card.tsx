import { useCardData, useCardStudioStore } from "@grimo/client";
import { toMonthKey } from "@grimo/core";
import { type CardPaletteKey, cardPalettes } from "@grimo/tokens";
import { Link } from "@tanstack/react-router";
import { StoryCanvas } from "../card/story-canvas";
import { CARD_COMPONENTS } from "../card/templates";

/** Small preview of this month's shareable card (last style picked in the studio). */
export function MonthlyCard() {
  const studio = useCardStudioStore();
  const data = useCardData({ kind: "month", month: toMonthKey(new Date()) });
  if (!data) return null;
  const Card = CARD_COMPONENTS[studio.template];
  const palette = cardPalettes[studio.palette as CardPaletteKey] ?? cardPalettes.brasa;

  return (
    <div className="flex flex-col items-center gap-4">
      <Link to="/card" aria-label="Personalizar o card do mês">
        <StoryCanvas
          scale={0.28}
          className="rounded-xl shadow-lg shadow-shadow transition hover:-translate-y-1"
        >
          <Card
            data={data}
            palette={palette}
            showCover={studio.showCover}
            showDeltas={studio.showDeltas}
          />
        </StoryCanvas>
      </Link>
      <Link
        to="/card"
        className="bg-accent-gradient rounded-full px-5 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-accent-foreground shadow-md shadow-accent/30 hover:opacity-90"
      >
        Personalizar e compartilhar
      </Link>
    </div>
  );
}
