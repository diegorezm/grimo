import { useEffect, useRef } from "react";
import { cn } from "@/utils/cn";

/**
 * End of a cursor-paginated list: fetches the next page as it scrolls into view (a little
 * early, so reading never stops), and stays a button for keyboards and old browsers.
 * Pass the infinite query's own fields. Renders nothing on the last page.
 */
export function LoadMore({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  className,
}: {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => unknown;
  className?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  // Re-created after each page, so a sentinel still on screen asks for the next one too.
  useEffect(() => {
    const element = ref.current;
    if (!element || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void fetchNextPage();
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!hasNextPage) return null;
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => void fetchNextPage()}
      disabled={isFetchingNextPage}
      className={cn(
        "mx-auto block py-4 font-mono text-[11px] uppercase tracking-wider text-accent hover:opacity-80 disabled:text-text-muted",
        className,
      )}
    >
      {isFetchingNextPage ? "Carregando…" : "Carregar mais"}
    </button>
  );
}
