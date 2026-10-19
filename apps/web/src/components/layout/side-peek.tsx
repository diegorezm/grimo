import { type ReactNode, useEffect } from "react";

/**
 * Notion-style side peek: opens beside the page (which reflows to make room) on desktop and
 * covers the screen on mobile. `expand` is the control that opens the same content as a full
 * page; `footer` stays pinned at the bottom. Escape closes it.
 */
export function SidePeek({
  label,
  onClose,
  expand,
  footer,
  children,
}: {
  label: string;
  onClose: () => void;
  expand?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.querySelector("dialog[open]")) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <aside
      aria-label={label}
      className="animate-peek fixed inset-0 z-30 flex flex-col bg-surface lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:w-[min(46rem,50%)] lg:shrink-0 lg:border-l lg:border-border"
    >
      <div className="flex items-center gap-1 px-3 py-2.5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          title="Fechar (Esc)"
          className="grid size-9 place-items-center rounded-md text-text-muted transition hover:bg-surface-muted hover:text-text"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5 fill-none stroke-current"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 7 5 5-5 5M13 7l5 5-5 5" />
          </svg>
        </button>
        {expand}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-10 sm:px-10">{children}</div>
      {footer && (
        <div className="flex flex-wrap items-center gap-3 border-t border-border bg-surface px-6 py-4 sm:px-10">
          {footer}
        </div>
      )}
    </aside>
  );
}

/** Icon for "open as full page", for use as `expand`. */
export function ExpandIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-[18px] fill-none stroke-current"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7" />
    </svg>
  );
}
