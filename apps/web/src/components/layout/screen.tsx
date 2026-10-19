import type { ReactNode } from "react";

/** Standard full-width content area for a screen, with an optional title row. */
export function Screen({
  title,
  subtitle,
  actions,
  children,
}: {
  title?: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-8 px-4 pt-2 pb-8 lg:px-8 lg:pt-6">
      {title && (
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-medium italic lg:text-4xl">{title}</h1>
            {subtitle && <p className="mt-1 text-text-muted">{subtitle}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </div>
  );
}
