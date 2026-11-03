import { FEELING_LABELS, FEELINGS, type Feeling, MAX_FEELINGS, toggleFeeling } from "@grimo/core";
import { cn } from "@/utils/cn";

/**
 * Pick up to `MAX_FEELINGS` feelings. `suggested` (what the reading diary says) offers to fill
 * them in one click while nothing is picked.
 */
export function FeelingPicker({
  value,
  onChange,
  suggested = [],
  label = "Como esse livro te fez sentir?",
}: {
  value: readonly Feeling[];
  onChange: (feelings: Feeling[]) => void;
  suggested?: readonly Feeling[];
  label?: string;
}) {
  const full = value.length >= MAX_FEELINGS;
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 flex w-full flex-wrap items-baseline justify-between gap-2 text-sm text-text-muted">
        <span>{label}</span>
        <span className="font-mono text-[10px] uppercase tracking-wider">
          {value.length}/{MAX_FEELINGS}
        </span>
      </legend>
      {value.length === 0 && suggested.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([...suggested])}
          className="w-fit text-left font-mono text-[11px] uppercase tracking-wider text-accent hover:opacity-80"
        >
          Pelo seu diário: {suggested.map((feeling) => FEELING_LABELS[feeling]).join(", ")} →
        </button>
      )}
      <div className="flex flex-wrap gap-1.5">
        {FEELINGS.map((feeling) => {
          const picked = value.includes(feeling);
          return (
            <button
              key={feeling}
              type="button"
              aria-pressed={picked}
              disabled={full && !picked}
              onClick={() => onChange(toggleFeeling(value, feeling))}
              className={cn(
                "rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition",
                picked
                  ? "bg-accent text-accent-foreground"
                  : "border border-border text-text-muted hover:border-accent hover:text-accent disabled:opacity-40 disabled:hover:border-border disabled:hover:text-text-muted",
              )}
            >
              {FEELING_LABELS[feeling]}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Feelings shown on a card or a diary line ("Tensão · Medo"). */
export function FeelingTags({
  feelings,
  className,
}: {
  feelings: readonly Feeling[];
  className?: string;
}) {
  if (feelings.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap gap-1", className)} aria-label="Sentimentos">
      {feelings.map((feeling) => (
        <li
          key={feeling}
          className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent"
        >
          {FEELING_LABELS[feeling]}
        </li>
      ))}
    </ul>
  );
}
