import { FINISH_PRESETS, finishByIn } from "@grimo/core";
import { cn } from "@/utils/cn";

/**
 * "Terminar em": no date, or one of the presets (2 semanas, 1 mês…). Controlled by `days`
 * (`undefined`: nothing picked yet).
 */
export function FinishPicker({
  days,
  onChange,
}: {
  days: number | null | undefined;
  onChange: (days: number | null) => void;
}) {
  const options = [{ days: null, label: "Sem data" }, ...FINISH_PRESETS];
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="sr-only">Terminar em</legend>
      {options.map((option) => (
        <button
          key={option.label}
          type="button"
          aria-pressed={days === option.days}
          onClick={() => onChange(option.days)}
          className={cn(
            "rounded-full px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-wider transition",
            days === option.days
              ? "bg-accent-gradient text-accent-foreground shadow-md shadow-accent/30"
              : "border border-border text-text-muted hover:bg-surface-muted hover:text-text",
          )}
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  );
}

/** The date a picked preset means (end of that day). */
export const finishByFor = (days: number | null) =>
  days === null ? null : finishByIn(days, new Date());

/** "30 de novembro". */
export const formatFinishBy = (ms: number) =>
  new Date(ms).toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
