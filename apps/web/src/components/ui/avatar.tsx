import { cn } from "@/utils/cn";

export function Avatar({
  src,
  name,
  className,
}: {
  src: string | null;
  name: string;
  className?: string;
}) {
  const base = cn("size-10 shrink-0 rounded-full bg-surface-muted object-cover", className);
  if (src) return <img src={src} alt={name} className={base} />;
  return (
    <span className={cn(base, "grid place-items-center font-serif text-sm text-text-muted")}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
