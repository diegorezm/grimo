import { THEME_LABELS, THEME_PREFERENCES } from "@grimo/core";
import { MoonIcon, SunIcon, SystemIcon } from "@/components/ui/icons";
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

const THEME_ICONS = { system: SystemIcon, light: SunIcon, dark: MoonIcon } as const;

/** Single icon button that cycles Sistema → Claro → Escuro (for the narrow sidebar). */
export function ThemeCycleButton({ className }: { className?: string }) {
  const preference = useThemePreference();
  const next =
    THEME_PREFERENCES[(THEME_PREFERENCES.indexOf(preference) + 1) % THEME_PREFERENCES.length]!;
  const Icon = THEME_ICONS[preference];
  return (
    <button
      type="button"
      onClick={() => setThemePreference(next)}
      title={`Aparência: ${THEME_LABELS[preference]}`}
      aria-label={`Aparência: ${THEME_LABELS[preference]}. Mudar para ${THEME_LABELS[next]}`}
      className={cn(
        "grid size-11 place-items-center rounded-md text-text-muted transition hover:bg-surface-muted hover:text-text",
        className,
      )}
    >
      <Icon />
    </button>
  );
}
