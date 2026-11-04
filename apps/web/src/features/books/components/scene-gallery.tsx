import { READING_SCENES, type ReadingScene as Scene } from "@grimo/core";
import { useId } from "react";
import { cn } from "@/utils/cn";
import { ReadingScene } from "./reading-scene";

/**
 * The reading themes as options, each a small example of the timer on it. Only the chosen one
 * moves, so a grid of paintings stays calm.
 */
export function SceneGallery({
  value,
  onChange,
}: {
  value: Scene;
  onChange: (scene: Scene) => void;
}) {
  const name = useId();
  return (
    <fieldset className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <legend className="sr-only">Tema da sessão de leitura</legend>
      {(Object.keys(READING_SCENES) as Scene[]).map((option) => {
        const chosen = value === option;
        return (
          <label
            key={option}
            className={cn(
              "flex cursor-pointer flex-col overflow-hidden rounded-lg border transition has-focus-visible:ring-2 has-focus-visible:ring-accent",
              chosen ? "border-accent bg-surface-muted" : "border-border hover:border-accent/50",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={chosen}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            <span
              data-reading-scene={option}
              className="relative flex aspect-video items-center justify-center overflow-hidden bg-surface text-text"
            >
              <ReadingScene scene={option} paused={!chosen} preview />
              <span className="relative font-serif text-2xl font-medium tabular-nums">25:00</span>
            </span>
            <span className="px-3 py-2.5 font-mono text-xs font-medium uppercase tracking-wider">
              {READING_SCENES[option]}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
