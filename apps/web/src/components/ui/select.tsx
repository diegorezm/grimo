import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils/cn";
import { CheckIcon, ChevronDownIcon } from "./icons";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

/** Looks of the trigger button; the popup follows the same type (plain or mono caps). */
const VARIANTS = {
  /** Filters and forms: muted pill. */
  field: {
    trigger:
      "rounded-full bg-surface-muted px-4 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-accent/40",
    option: "text-sm",
  },
  /** Inside cards, when a value is set: small bordered pill, full width. */
  compact: {
    trigger:
      "w-full rounded-full border border-border bg-surface-muted px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider focus-visible:border-accent",
    option: "font-mono text-[11px] uppercase tracking-wider",
  },
  /** Inside cards, when nothing is set yet: the call to action. */
  accent: {
    trigger:
      "bg-accent-gradient w-full rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-accent-foreground focus-visible:ring-2 focus-visible:ring-accent/40",
    option: "font-mono text-[11px] uppercase tracking-wider",
  },
  /** Inside cards, discreet: muted text until hovered. */
  quiet: {
    trigger:
      "w-full rounded-full border border-border bg-surface px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-text-muted hover:text-text focus-visible:border-accent",
    option: "font-mono text-[11px] uppercase tracking-wider",
  },
} as const;

/** Most height the popup takes before it scrolls. */
const MAX_HEIGHT = 288;
/** Gap kept to the edges of the screen and to the trigger. */
const EDGE = 8;

interface Placement {
  left: number;
  minWidth: number;
  /** Distance from the top of the screen (opens below) or from its bottom (opens above). */
  top?: number;
  bottom?: number;
  maxHeight: number;
}

/**
 * A select that looks like the rest of the app, in place of the browser's. Same pattern as a
 * native one for keyboards and screen readers (a combobox button with a listbox): arrows, Home,
 * End, type-ahead, Enter or Space to choose, Escape to close. The list is drawn on `document.body`
 * so no card or scroll area clips it, and flips above the button when there is no room below.
 *
 * Give an option `value: ""` for a "no filter" choice; `placeholder` shows while `value` matches
 * no option.
 */
export function Select<T extends string>({
  value,
  onChange,
  options,
  label,
  placeholder = "Selecionar",
  variant = "field",
  className,
  disabled,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly SelectOption<T>[];
  /** Accessible name (there is no visible `<label>`). */
  label: string;
  placeholder?: string;
  variant?: keyof typeof VARIANTS;
  /** Layout from the parent (margins, width); the look comes from `variant`. */
  className?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const optionId = (index: number) => `${id}-option-${index}`;
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const style = VARIANTS[variant];
  const selected = options.findIndex((option) => option.value === value);
  const current = selected >= 0 ? options[selected] : undefined;

  const close = useCallback(() => {
    setOpen(false);
    setPlacement(null);
  }, []);

  const show = () => {
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    const below = window.innerHeight - rect.bottom - EDGE * 2;
    const above = rect.top - EDGE * 2;
    const flip = below < Math.min(MAX_HEIGHT, 180) && above > below;
    setPlacement({
      left: rect.left,
      minWidth: rect.width,
      ...(flip ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }),
      maxHeight: Math.min(MAX_HEIGHT, flip ? above : below),
    });
    setActive(selected >= 0 ? selected : 0);
    setOpen(true);
  };

  const choose = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    close();
    trigger.current?.focus();
  };

  // Keep the popup inside the screen horizontally once its width is known.
  useLayoutEffect(() => {
    if (!open || !placement || !list.current) return;
    const width = list.current.getBoundingClientRect().width;
    const left = Math.max(EDGE, Math.min(placement.left, window.innerWidth - width - EDGE));
    if (left !== placement.left) setPlacement({ ...placement, left });
  }, [open, placement]);

  // Close on outside click, resize, or when something else scrolls (the button moved).
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!trigger.current?.contains(target) && !list.current?.contains(target)) close();
    };
    const scrolled = (event: Event) => {
      if (!list.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", scrolled, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", scrolled, true);
    };
  }, [open, close]);

  // Keep the highlighted option in view while arrowing through a long list.
  useEffect(() => {
    if (open) document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
  });

  const typeahead = (key: string) => {
    const now = Date.now();
    typed.current.text = now - typed.current.at > 600 ? key : typed.current.text + key;
    typed.current.at = now;
    const text = typed.current.text.toLowerCase();
    const from = text.length === 1 ? active + 1 : active;
    for (let step = 0; step < options.length; step++) {
      const index = (from + step) % options.length;
      if (options[index]?.label.toLowerCase().startsWith(text)) return setActive(index);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        show();
      }
      return;
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActive((index) => Math.min(options.length - 1, index + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActive((index) => Math.max(0, index - 1));
        break;
      case "Home":
        event.preventDefault();
        setActive(0);
        break;
      case "End":
        event.preventDefault();
        setActive(options.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(active);
        break;
      case "Escape":
        // Only the list closes: an open side peek keeps listening for its own Escape.
        event.preventDefault();
        event.stopPropagation();
        close();
        break;
      case "Tab":
        close();
        break;
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) typeahead(event.key);
    }
  };

  return (
    <>
      <button
        ref={trigger}
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? optionId(active) : undefined}
        disabled={disabled}
        onClick={() => (open ? close() : show())}
        onKeyDown={onKeyDown}
        className={cn(
          "inline-flex items-center justify-between gap-2 text-left outline-none transition disabled:opacity-50",
          style.trigger,
          className,
        )}
      >
        <span className={cn("truncate", !current && "text-text-muted")}>
          {current?.label ?? placeholder}
        </span>
        <ChevronDownIcon
          className={cn("size-4 shrink-0 text-text-muted transition", open && "rotate-180")}
        />
      </button>
      {open &&
        placement &&
        createPortal(
          <div
            ref={list}
            id={listId}
            role="listbox"
            aria-label={label}
            style={{
              left: placement.left,
              top: placement.top,
              bottom: placement.bottom,
              minWidth: placement.minWidth,
              maxHeight: placement.maxHeight,
            }}
            className="animate-peek fixed z-50 max-w-[calc(100vw-1rem)] overflow-y-auto rounded-lg border border-edge bg-surface p-1 shadow-lg shadow-shadow"
          >
            {options.map((option, index) => {
              const isSelected = index === selected;
              return (
                // biome-ignore lint/a11y/useFocusableInteractive: options are never focused; the button points at the active one with aria-activedescendant
                // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard is handled on the combobox button, which keeps focus
                <div
                  key={option.value}
                  id={optionId(index)}
                  role="option"
                  aria-selected={isSelected}
                  // Keep focus on the button while clicking.
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => choose(index)}
                  onMouseMove={() => setActive(index)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-4 rounded-md px-3 py-2 whitespace-nowrap",
                    style.option,
                    index === active && "bg-surface-muted",
                    isSelected ? "font-medium text-accent" : "text-text",
                  )}
                >
                  {option.label}
                  {isSelected && <CheckIcon className="size-4" />}
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
