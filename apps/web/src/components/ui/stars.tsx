import { cn } from "@/utils/cn";

const SCALE = [1, 2, 3, 4, 5] as const;

/** Gold 1–5 star rating. Read-only unless `onChange` is given. */
export function Stars({
  rating,
  onChange,
  className,
}: {
  rating: number | null;
  onChange?: (rating: number) => void;
  className?: string;
}) {
  const value = rating ?? 0;
  if (!onChange) {
    return (
      <p className={cn("text-sm tracking-wider text-gold", className)}>
        <span className="sr-only">Nota {value} de 5</span>
        <span aria-hidden="true">
          {"★".repeat(value)}
          <span className="text-border">{"★".repeat(5 - value)}</span>
        </span>
      </p>
    );
  }
  return (
    <fieldset className={cn("flex", className)}>
      <legend className="sr-only">Sua nota</legend>
      {SCALE.map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} de 5`}
          aria-pressed={star === value}
          onClick={() => onChange(star)}
          className={cn(
            "px-px text-base leading-none transition hover:scale-110",
            star <= value ? "text-gold" : "text-border hover:text-gold/60",
          )}
        >
          ★
        </button>
      ))}
    </fieldset>
  );
}
