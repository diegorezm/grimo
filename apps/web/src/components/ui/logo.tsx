import { cn } from "@/utils/cn";

/**
 * Brand mark: an open journal with a gold sparkle (source: packages/tokens/brand/mark.svg).
 * Inline and painted with tokens, so it follows the light / dark theme.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 -4 200 186"
      aria-hidden="true"
      className={cn("h-10 w-auto shrink-0", className)}
    >
      <path
        className="fill-logo-cover"
        d="M6 64 Q54 46 100 68 Q146 46 194 64 V174 Q146 158 100 180 Q54 158 6 174Z"
      />
      <path
        className="fill-surface"
        d="M14 60 Q58 43 100 64 Q142 43 186 60 V166 Q142 151 100 172 Q58 151 14 166Z"
      />
      <path
        className="fill-none stroke-border"
        strokeWidth="2"
        d="M14 160 Q58 145 100 166 Q142 145 186 160 M14 154 Q58 139 100 160 Q142 139 186 154"
      />
      <path className="fill-accent-start" d="M100 58 Q62 36 20 50 V148 Q62 134 100 156Z" />
      <path className="fill-accent" d="M100 58 Q138 36 180 50 V148 Q138 134 100 156Z" />
      <path className="stroke-logo-spine" strokeWidth="4" strokeLinecap="round" d="M100 58 V172" />
      <path className="fill-gold" d="M100 0l6 16 16 6-16 6-6 16-6-16-16-6 16-6z" />
    </svg>
  );
}
