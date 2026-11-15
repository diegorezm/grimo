import { type ReactNode, useEffect, useId, useRef } from "react";
import { cn } from "@/utils/cn";

/**
 * A modal on a dimmed backdrop: Escape or a click outside closes it, and focus moves into it.
 * `title` names it for screen readers (and heads it).
 */
export function Dialog({
  title,
  onClose,
  children,
  className,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  const close = useRef(onClose);
  close.current = onClose;

  // Once, on open: focus moves in and Escape closes.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close.current();
    window.addEventListener("keydown", onKey);
    panel.current?.querySelector<HTMLElement>("input, textarea, button")?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    // Clicking the backdrop closes it; Escape does too (keyboard).
    // biome-ignore lint/a11y/noStaticElementInteractions: the backdrop is not a control
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-[2px] animate-[fade-in_.2s_ease_both] motion-reduce:animate-none"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "page flex max-h-[90dvh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-2xl p-6 text-left text-text animate-[toast-in_.35s_cubic-bezier(.2,1,.3,1)_both] motion-reduce:animate-none",
          className,
        )}
      >
        <h2 id={titleId} className="text-2xl font-medium italic">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
