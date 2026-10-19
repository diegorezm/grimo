import { THEME_LABELS, THEME_PREFERENCES } from "@grimo/core";
import { setThemePreference, useThemePreference } from "@/lib/theme";
import { cn } from "@/utils/cn";

/** Segmented control: Sistema / Claro / Escuro. */
export function ThemeToggle({ className }: { className?: string }) {
  const preference = useThemePreference();
  return (
    <fieldset
      className={cn(
        "glass inline-flex rounded-full p-1 font-mono text-[11px] uppercase",
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
            "rounded-full px-2.5 py-1 tracking-wider transition",
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
