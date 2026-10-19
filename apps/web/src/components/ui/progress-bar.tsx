import { cn } from "@/utils/cn";

/** Rose → lavender progress bar with the percentage beside it. */
export function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
        <div className="bg-accent-gradient h-full rounded-full" style={{ width: `${percent}%` }} />
      </div>
      <span className="font-mono text-[11px] font-semibold text-accent">{percent}%</span>
    </div>
  );
}
