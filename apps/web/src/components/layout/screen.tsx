import { useCanGoBack, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ChevronLeftIcon } from "@/components/ui/icons";

/**
 * Standard full-width content area for a screen, with an optional title row. `back` adds a
 * chevron link above the title that returns to the previous screen (or home).
 */
export function Screen({
  back,
  title,
  subtitle,
  actions,
  children,
}: {
  back?: string;
  title?: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-8 px-4 pt-2 pb-8 lg:px-8 lg:pt-6">
      {(title || back) && (
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            {back && <BackButton label={back} />}
            {title && <h1 className="text-3xl font-medium italic lg:text-4xl">{title}</h1>}
            {subtitle && <p className="mt-1 text-text-muted">{subtitle}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </div>
  );
}

function BackButton({ label }: { label: string }) {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  return (
    <button
      type="button"
      onClick={() => (canGoBack ? router.history.back() : router.navigate({ to: "/" }))}
      className="-ml-2 mb-3 flex items-center gap-1 rounded-full py-1 pr-3 pl-1 font-mono text-[11px] uppercase tracking-wider text-text-muted transition hover:bg-surface-muted hover:text-text"
    >
      <ChevronLeftIcon className="size-4" />
      {label}
    </button>
  );
}
