import { formatRating, nextRating, RATING_STEP, type StarFill, starFills } from "@grimo/core";
import { useState } from "react";
import { cn } from "@/utils/cn";

const SCALE = [1, 2, 3, 4, 5] as const;

/** One star: gold, half gold or empty. */
function Star({ fill }: { fill: StarFill }) {
  return (
    <span className="relative inline-block leading-none">
      <span className="text-border">★</span>
      {fill !== "empty" && (
        <span
          className={cn(
            "absolute inset-y-0 left-0 overflow-hidden text-gold",
            fill === "half" ? "w-1/2" : "w-full",
          )}
        >
          ★
        </span>
      )}
    </span>
  );
}

/**
 * Gold rating in half stars. Read-only unless `onChange` is given: then the left half of a star
 * gives its ½ and the right half the whole star, and clicking the current rating clears it.
 */
export function Stars({
  rating,
  onChange,
  className,
}: {
  rating: number | null;
  onChange?: (rating: number | null) => void;
  className?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  if (!onChange) {
    return (
      <span className={cn("inline-flex text-sm tracking-wider", className)}>
        <span className="sr-only">Nota {formatRating(rating ?? 0)} de 5</span>
        <span aria-hidden="true" className="flex">
          {starFills(rating).map((fill, i) => (
            <Star key={SCALE[i]} fill={fill} />
          ))}
        </span>
      </span>
    );
  }
  const shown = starFills(hover ?? rating);
  return (
    <fieldset className={cn("flex items-center gap-2", className)}>
      <legend className="sr-only">Sua nota</legend>
      <span className="flex">
        {SCALE.map((star, i) => (
          <span key={star} className="relative px-px transition hover:scale-110">
            <Star fill={shown[i]!} />
            {[star - RATING_STEP, star].map((value, half) => (
              <button
                key={value}
                type="button"
                aria-label={`${formatRating(value)} de 5`}
                aria-pressed={value === rating}
                onMouseEnter={() => setHover(value)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(value)}
                onBlur={() => setHover(null)}
                onClick={() => onChange(nextRating(rating, value))}
                className={cn("absolute inset-y-0 w-1/2", half === 0 ? "left-0" : "right-0")}
              />
            ))}
          </span>
        ))}
      </span>
      {(hover ?? rating) !== null && (
        <span className="font-mono text-xs text-text-muted" aria-hidden="true">
          {formatRating((hover ?? rating)!)}
        </span>
      )}
    </fieldset>
  );
}
