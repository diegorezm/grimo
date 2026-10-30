import type { ReactNode } from "react";
import { Sparkle } from "@/components/ui/sparkle";
import { cn } from "@/utils/cn";

/** Responsive grid of cards, like the readers page: columns follow the space the screen has. */
export function CardGrid({ children }: { children: ReactNode }) {
  return (
    <ul className="grid grid-cols-1 gap-5 @xl/main:grid-cols-2 @6xl/main:grid-cols-3">
      {children}
    </ul>
  );
}

/** Frame of a card: a page that lifts on hover; `selected` marks the one open in the peek. */
export function Card({
  selected = false,
  className,
  children,
}: {
  selected?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <li
      className={cn(
        "page group relative flex flex-col rounded-lg transition hover:-translate-y-0.5 hover:border-accent/40",
        selected && "ring-2 ring-accent",
        className,
      )}
    >
      {children}
    </li>
  );
}

/** Top strip of a card (the profile banner's gradient as a wash); tags go in its corners. */
export function CardBanner({
  left,
  right,
  children,
}: {
  left?: ReactNode;
  right?: ReactNode;
  /** Decoration drawn over the wash (e.g. little book spines). */
  children?: ReactNode;
}) {
  return (
    <div className="relative h-20 overflow-hidden rounded-t-lg bg-surface-muted">
      <div aria-hidden="true" className="bg-accent-gradient absolute inset-0 opacity-25" />
      <Sparkle className="absolute right-1/2 bottom-3 size-3 opacity-70" />
      {children}
      {left && <Tag className="top-3 left-3 text-text-muted">{left}</Tag>}
      {right && <Tag className="top-3 right-3 text-accent">{right}</Tag>}
    </div>
  );
}

function Tag({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "absolute rounded-sm bg-surface px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider",
        className,
      )}
    >
      {children}
    </span>
  );
}
