import { type OnboardingStepId, useOnboardingChecklist } from "@grimo/client";
import { Link, type LinkProps } from "@tanstack/react-router";
import { cn } from "@/utils/cn";

/** Where each unfinished step is done. */
const TARGETS: Record<OnboardingStepId, LinkProps> = {
  account: { to: "/" },
  book: { to: "/onboarding" },
  goal: { to: ".", search: (prev) => ({ ...prev, panel: "profile" as const }) },
  follow: { to: "/people" },
};

/**
 * "Primeiros passos" on the dashboard until they're all done: open loops a new reader wants to
 * close (Zeigarnik), with progress that never starts at zero. Disappears when complete.
 */
export function OnboardingChecklist({ className }: { className?: string }) {
  const checklist = useOnboardingChecklist();
  if (!checklist || checklist.complete) return null;

  return (
    <section
      aria-labelledby="first-steps-title"
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-accent/40 bg-accent/5 p-5",
        className,
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="first-steps-title" className="text-xl font-medium italic">
          Primeiros passos
        </h2>
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
          {checklist.done} de {checklist.total}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-muted">
        <div
          className="bg-accent-gradient h-full rounded-full transition-[width] duration-500"
          style={{ width: `${checklist.percent}%` }}
        />
      </div>
      <ol className="grid gap-2 sm:grid-cols-2">
        {checklist.steps.map((step) =>
          step.done ? (
            <li
              key={step.id}
              className="flex items-center gap-2.5 text-sm text-text-muted line-through"
            >
              <span className="grid size-5 place-items-center rounded-full bg-accent text-[11px] text-accent-foreground no-underline">
                ✓
              </span>
              {step.label}
            </li>
          ) : (
            <li key={step.id}>
              <Link
                {...TARGETS[step.id]}
                resetScroll={false}
                className={cn(
                  "flex items-center gap-2.5 text-sm transition hover:text-accent",
                  step.id === checklist.next?.id && "font-medium",
                )}
              >
                <span className="size-5 rounded-full border border-border" />
                {step.label} →
              </Link>
            </li>
          ),
        )}
      </ol>
    </section>
  );
}
