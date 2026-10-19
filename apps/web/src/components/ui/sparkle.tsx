import type { CSSProperties } from "react";
import { cn } from "@/utils/cn";

/** Four-point gold sparkle — the journal's signature ornament. Decorative only. */
export function Sparkle({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={cn("size-4 shrink-0 fill-gold", className)}
      style={style}
    >
      <path d="M12 0C13 8 16 11 24 12C16 13 13 16 12 24C11 16 8 13 0 12C8 11 11 8 12 0Z" />
    </svg>
  );
}
