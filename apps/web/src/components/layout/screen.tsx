import type { ReactNode } from "react";

/** Standard content area for a screen inside the app frame, with an optional title. */
export function Screen({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-2 lg:px-8 lg:py-6">
      {title && <h1 className="mb-6 text-3xl font-medium italic">{title}</h1>}
      {children}
    </div>
  );
}
