import { cn } from "@/utils/cn";

export function Avatar({
  src,
  name,
  size = "size-10",
  className,
}: {
  src: string | null;
  name: string;
  /** Size utility, e.g. `size-8` (separate because `cn` does not merge conflicting classes). */
  size?: string;
  className?: string;
}) {
  const base = cn("shrink-0 rounded-full bg-surface-muted object-cover", size, className);
  if (src) return <img src={src} alt={name} className={base} />;
  return (
    <span className={cn(base, "grid place-items-center font-serif text-sm text-text-muted")}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
