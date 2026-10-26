import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/utils/cn";

/** Tilt for `animate-float` (it keeps the rotation while bobbing). */
const tilt = (deg: number) => ({ "--tilt": `${deg}deg` }) as CSSProperties;

/**
 * Words run over with a highlighter (rose → lavender), like in a well-loved paperback.
 * `after` (punctuation) stays glued to them without being highlighted.
 */
export function Marker({ children, after }: { children: ReactNode; after?: string }) {
  return (
    <span className="whitespace-nowrap">
      <span className="relative inline-block">
        <span
          aria-hidden="true"
          className="highlighter absolute inset-x-[-0.15em] bottom-[0.06em] h-[0.5em] -rotate-1"
        />
        <span className="relative">{children}</span>
      </span>
      {after}
    </span>
  );
}

/** A sticky note with a strip of washi tape on top. Position it with `className` (absolute). */
export function StickyNote({
  children,
  rotate = -4,
  className,
}: {
  children: ReactNode;
  rotate?: number;
  className?: string;
}) {
  return (
    <div
      style={tilt(rotate)}
      className={cn(
        "animate-float w-44 bg-note px-4 pt-6 pb-4 font-serif text-sm leading-snug italic text-text shadow-lg shadow-shadow",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 -rotate-3 bg-tape opacity-80"
      />
      {children}
    </div>
  );
}

/** A notification from a friend, floating over the mockups. */
export function Bubble({
  initial,
  children,
  rotate = 2,
  className,
}: {
  initial: string;
  children: ReactNode;
  rotate?: number;
  className?: string;
}) {
  return (
    <div
      style={tilt(rotate)}
      className={cn(
        "animate-float glass flex max-w-60 items-center gap-2.5 rounded-2xl py-2 pr-4 pl-2 text-xs leading-snug",
        className,
      )}
    >
      <span className="bg-accent-gradient grid size-8 shrink-0 place-items-center rounded-full font-serif text-sm font-bold text-accent-foreground">
        {initial}
      </span>
      <span>{children}</span>
    </div>
  );
}

/** Enough covers per copy of the strip to be wider than any screen (~132px each). */
const MARQUEE_MIN_COVERS = 24;

/**
 * Covers sliding by, like browsing a friend's shelf. Pauses on hover; still for reduced motion.
 * Two identical copies, each wider than the viewport and with its trailing gap as padding, so
 * sliding by exactly one copy (-50%) loops without a jump or an empty edge.
 */
export function CoverMarquee({ covers }: { covers: string[] }) {
  const repeat = Math.max(1, Math.ceil(MARQUEE_MIN_COVERS / covers.length));
  const copy = Array.from({ length: repeat }, () => covers).flat();
  // Same speed (~18px/s) whatever the copy width.
  const duration = { animationDuration: `${copy.length * 7.5}s` };
  return (
    <div className="group overflow-hidden py-6 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <div
        className="animate-marquee flex w-max group-hover:[animation-play-state:paused]"
        style={duration}
      >
        {[0, 1].map((half) => (
          <ul key={half} aria-hidden={half === 1 || undefined} className="flex shrink-0 gap-5 pr-5">
            {copy.map((src, index) => (
              <li
                key={index}
                aria-hidden={index >= covers.length || undefined}
                className={cn("shrink-0", index % 2 ? "rotate-2" : "-rotate-2")}
              >
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="aspect-[2/3] w-24 rounded-sm object-cover shadow-md shadow-shadow sm:w-28"
                />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
