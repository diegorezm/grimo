import { cn } from "@/utils/cn";

export function BookCover({
  src,
  title,
  className,
}: {
  src: string | null;
  title: string;
  className?: string;
}) {
  // `cn` does not merge conflicting classes, so a custom className replaces the default width.
  const base = cn(
    "aspect-[2/3] shrink-0 rounded-sm bg-surface-muted object-cover",
    className ?? "w-16",
  );
  if (src) return <img src={src} alt={title} loading="lazy" className={base} />;
  return (
    <div className={cn(base, "grid place-items-center p-1 text-center font-serif text-[10px]")}>
      {title}
    </div>
  );
}
