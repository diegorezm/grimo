import { useCardStudioStore } from "@grimo/client";
import { type CardPalette, type CardPaletteKey, cardPalettes } from "@grimo/tokens";
import { type ReactNode, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { downloadCard, StoryCanvas, shareCard } from "./story-canvas";

/**
 * A one-template Stories card (group, finished book, quote): the preview, share / download, and
 * the colors (shared with the monthly card). `note` explains the card under the colors.
 */
export function PaletteStudio({
  fileName,
  shareTitle,
  note,
  children,
}: {
  fileName: string;
  shareTitle: string;
  note?: ReactNode;
  children: (palette: CardPalette) => ReactNode;
}) {
  const studio = useCardStudioStore();
  const preview = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const palette = cardPalettes[studio.palette as CardPaletteKey] ?? cardPalettes.brasa;

  async function run(action: "share" | "download") {
    if (!preview.current) return;
    setBusy(true);
    try {
      if (action === "share") await shareCard(preview.current, fileName, shareTitle);
      else await downloadCard(preview.current, fileName);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 items-start gap-10 @4xl/main:grid-cols-[auto_minmax(0,1fr)]">
      <div className="flex flex-col items-center gap-4 @4xl/main:sticky @4xl/main:top-6">
        <StoryCanvas ref={preview} scale={0.36} className="rounded-xl shadow-xl shadow-shadow">
          {children(palette)}
        </StoryCanvas>
        <div className="flex gap-3">
          <Button onClick={() => run("share")} disabled={busy}>
            Compartilhar
          </Button>
          <Button variant="secondary" onClick={() => run("download")} disabled={busy}>
            Baixar PNG
          </Button>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted">Cores</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(cardPalettes).map(([key, option]) => {
            const active = key === studio.palette;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => studio.set({ palette: key })}
                className={cn(
                  "flex items-center gap-2.5 rounded-full border py-1.5 pr-4 pl-1.5 transition",
                  active
                    ? "border-accent bg-surface-muted"
                    : "border-border hover:bg-surface-muted/60",
                )}
              >
                {/* Swatch: fixed card colors, not theme tokens. */}
                <span
                  aria-hidden="true"
                  className="size-8 rounded-full border border-border"
                  style={{
                    background: `linear-gradient(135deg, ${option.bg} 50%, ${option.accent} 50%)`,
                  }}
                />
                <span className="text-sm">{option.label}</span>
              </button>
            );
          })}
        </div>
        {note && <p className="max-w-md text-sm text-text-muted">{note}</p>}
      </div>
    </div>
  );
}
