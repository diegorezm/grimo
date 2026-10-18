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
  const base = cn("aspect-[2/3] w-16 shrink-0 rounded-sm bg-surface-muted object-cover", className);
  if (src) return <img src={src} alt={title} loading="lazy" className={base} />;
  return (
    <div className={cn(base, "grid place-items-center p-1 text-center font-serif text-[10px]")}>
      {title}
    </div>
  );
}
