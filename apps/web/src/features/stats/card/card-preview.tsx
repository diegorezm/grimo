import type { CardTemplate } from "@grimo/core";
import { type CardPaletteKey, cardPalettes } from "@grimo/tokens";
import { StoryCanvas } from "./story-canvas";
import { CARD_COMPONENTS } from "./templates";
import type { CardData } from "./types";

/** A month card rendered from `data` (no account needed): landing page and onboarding. */
export function CardPreview({
  data,
  template = "fita",
  palette = "brasa",
  scale,
  className,
}: {
  data: CardData;
  template?: CardTemplate;
  palette?: CardPaletteKey;
  scale: number;
  className?: string;
}) {
  const Card = CARD_COMPONENTS[template];
  return (
    <StoryCanvas scale={scale} className={className}>
      <Card data={data} palette={cardPalettes[palette]} showCover showDeltas />
    </StoryCanvas>
  );
}
