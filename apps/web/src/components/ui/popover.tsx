import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";

/**
 * A panel that opens under its trigger and closes on Escape, a click outside or `close()`.
 * `trigger` renders the button (given whether it's open and the toggle); `children` gets `close`.
 */
export function Popover({
  trigger,
  children,
  align = "left",
  placement = "below",
  className,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  /** Opens under the trigger, or above it (a bar at the bottom of the screen). */
  placement?: "below" | "above";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      {trigger({ open, toggle: () => setOpen((value) => !value) })}
      {open && (
        <div
          className={cn(
            "page absolute z-40 rounded-2xl p-2 text-text animate-[toast-in_.25s_cubic-bezier(.2,1,.3,1)_both] motion-reduce:animate-none",
            placement === "above" ? "bottom-full mb-2" : "top-full mt-2",
            align === "right" ? "right-0" : "left-0",
            className,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

/** One row of a menu in a `Popover`. */
export function MenuItem({
  onClick,
  danger,
  children,
}: {
  onClick: () => void;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-surface-muted",
        danger && "text-danger",
      )}
    >
      {children}
    </button>
  );
}
