import { SHELF_VIEW_HINTS, SHELF_VIEW_LABELS, SHELF_VIEWS } from "@grimo/core";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { setShelfView, useShelfView } from "@/lib/shelf-view";
import { cn } from "@/utils/cn";

/** "Preferências": how the app looks on this device (theme, how the shelf is shown). */
export function PreferencesSettings() {
  const view = useShelfView();

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4 border-b border-border pb-10">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-medium italic">Aparência</h2>
          <p className="text-text-muted">Tema claro, escuro ou o do seu aparelho.</p>
        </div>
        <ThemeToggle className="self-start" />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-medium italic">Estante</h2>
          <p className="text-text-muted">Como os seus livros aparecem em Estantes.</p>
        </div>
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="sr-only">Visão da estante</legend>
          {SHELF_VIEWS.map((option) => (
            <label
              key={option}
              className={cn(
                "flex cursor-pointer flex-col gap-1 rounded-lg border p-4 transition has-focus-visible:ring-2 has-focus-visible:ring-accent",
                view === option
                  ? "border-accent bg-surface-muted"
                  : "border-border hover:border-accent/50",
              )}
            >
              <input
                type="radio"
                name="shelf-view"
                value={option}
                checked={view === option}
                onChange={() => setShelfView(option)}
                className="sr-only"
              />
              <span className="font-mono text-xs font-medium uppercase tracking-wider">
                {SHELF_VIEW_LABELS[option]}
              </span>
              <span className="text-sm text-text-muted">{SHELF_VIEW_HINTS[option]}</span>
            </label>
          ))}
        </fieldset>
      </section>
    </div>
  );
}
