import { THEME_LABELS, THEME_PREFERENCES } from "@grimo/core";
import { setThemePreference, useThemePreference } from "@/lib/theme";
import { cn } from "@/utils/cn";

/** Segmented control: Sistema / Claro / Escuro. */
export function ThemeToggle({ className }: { className?: string }) {
  const preference = useThemePreference();
  return (
    <fieldset
      className={cn(
        "inline-flex rounded-md border border-border p-0.5 font-mono text-[11px] uppercase",
        className,
      )}
    >
      <legend className="sr-only">Aparência</legend>
      {THEME_PREFERENCES.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={preference === option}
          onClick={() => setThemePreference(option)}
          className={cn(
            "rounded-sm px-2 py-1 tracking-wider transition",
            preference === option
              ? "bg-primary text-primary-foreground"
              : "text-text-muted hover:text-text",
          )}
        >
          {THEME_LABELS[option]}
        </button>
      ))}
    </fieldset>
  );
}
