import { useCardData, useCardStudioStore } from "@grimo/client";
import {
  CARD_TEMPLATE_LABELS,
  CARD_TEMPLATES,
  type CardPeriod,
  shiftMonth,
  toMonthKey,
} from "@grimo/core";
import { type CardPaletteKey, cardPalettes } from "@grimo/tokens";
import { type ReactNode, useRef, useState } from "react";
import { Spinner } from "@/components/feedback/spinner";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { downloadCard, StoryCanvas, shareCard } from "./story-canvas";
import { CARD_COMPONENTS } from "./templates";

const THIS_MONTH = toMonthKey(new Date());
const THIS_YEAR = Number(THIS_MONTH.slice(0, 4));
/** The year so far, the last six months, and last year's retrospectiva. */
const PERIODS: CardPeriod[] = [
  { kind: "year", year: THIS_YEAR },
  ...Array.from({ length: 6 }, (_, i) => ({
    kind: "month" as const,
    month: shiftMonth(THIS_MONTH, -i),
  })),
  { kind: "year", year: THIS_YEAR - 1 },
];
const periodKey = (period: CardPeriod) =>
  period.kind === "month" ? period.month : String(period.year);
const monthChip = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});

/** Pick a layout, colors, period and details; preview live; share or download the PNG. */
export function CardStudio({ year }: { year?: number }) {
  const studio = useCardStudioStore();
  const [period, setPeriod] = useState<CardPeriod>(
    year ? { kind: "year", year } : { kind: "month", month: THIS_MONTH },
  );
  const data = useCardData(period);
  const preview = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const palette = cardPalettes[studio.palette as CardPaletteKey] ?? cardPalettes.brasa;
  const Card = CARD_COMPONENTS[studio.template];
  const fileName = `grimo-${periodKey(period)}-${studio.template}.png`;

  async function run(action: typeof shareCard) {
    if (!preview.current) return;
    setBusy(true);
    try {
      await action(preview.current, fileName);
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <Spinner />;
  const cardProps = { data, palette, showCover: studio.showCover, showDeltas: studio.showDeltas };

  return (
    <div className="grid grid-cols-1 items-start gap-10 @4xl/main:grid-cols-[auto_minmax(0,1fr)]">
      <div className="flex flex-col items-center gap-4 @4xl/main:sticky @4xl/main:top-6">
        <StoryCanvas ref={preview} scale={0.36} className="rounded-xl shadow-xl shadow-shadow">
          <Card {...cardProps} />
        </StoryCanvas>
        <div className="flex gap-3">
          <Button onClick={() => run(shareCard)} disabled={busy}>
            Compartilhar
          </Button>
          <Button variant="secondary" onClick={() => run(downloadCard)} disabled={busy}>
            Baixar PNG
          </Button>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-9">
        <Section title="Modelo">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {CARD_TEMPLATES.map((template) => {
              const Thumb = CARD_COMPONENTS[template];
              const active = template === studio.template;
              return (
                <button
                  key={template}
                  type="button"
                  aria-pressed={active}
                  onClick={() => studio.set({ template })}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-lg border p-3 text-center transition",
                    active
                      ? "border-accent bg-surface-muted"
                      : "border-border hover:bg-surface-muted/60",
                  )}
                >
                  <StoryCanvas
                    scale={0.1}
                    className="pointer-events-none rounded-md shadow-md shadow-shadow"
                  >
                    <Thumb {...cardProps} />
                  </StoryCanvas>
                  <span>
                    <span className="block font-serif font-medium">
                      {CARD_TEMPLATE_LABELS[template].label}
                    </span>
                    <span className="block text-xs text-text-muted">
                      {CARD_TEMPLATE_LABELS[template].description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Cores">
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
                  {/* Swatch: background with the two accents. Fixed card colors, not theme tokens. */}
                  <span
                    aria-hidden="true"
                    className="relative size-8 overflow-hidden rounded-full border border-border"
                    style={{ background: option.bg }}
                  >
                    <span
                      className="absolute right-0 bottom-0 size-4 rounded-tl-full"
                      style={{ background: option.accent }}
                    />
                    <span
                      className="absolute top-1 left-1 size-2.5 rounded-full"
                      style={{ background: option.accent2 }}
                    />
                  </span>
                  <span className="text-sm">{option.label}</span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Período">
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((option) => {
              const key = periodKey(option);
              const active = key === periodKey(period);
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setPeriod(option)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 font-mono text-xs uppercase tracking-wider transition",
                    active
                      ? "border-transparent bg-primary text-primary-foreground"
                      : "border-border text-text-muted hover:text-text",
                  )}
                >
                  {option.kind === "year"
                    ? `Ano ${option.year}`
                    : monthChip.format(new Date(`${option.month}-15T12:00:00Z`))}
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Detalhes">
          <div className="flex flex-col gap-3">
            <Toggle
              label="Mostrar a capa do favorito"
              checked={studio.showCover}
              onChange={(showCover) => studio.set({ showCover })}
            />
            <Toggle
              label="Comparar com o mês anterior"
              checked={studio.showDeltas}
              onChange={(showDeltas) => studio.set({ showDeltas })}
            />
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted">{title}</h2>
      {children}
    </section>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex w-fit cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative h-6 w-11 rounded-full bg-surface-muted transition peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40 after:absolute after:top-1 after:left-1 after:size-4 after:rounded-full after:bg-surface after:shadow after:transition peer-checked:after:translate-x-5"
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}
