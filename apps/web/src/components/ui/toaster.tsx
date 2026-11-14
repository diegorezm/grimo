import { type Toast, type ToastTone, useToastStore } from "@grimo/client";
import { cn } from "@/utils/cn";

const KICKERS: Record<ToastTone, string> = {
  success: "Salvo",
  info: "Aviso",
  error: "Não salvou",
};

/**
 * The notice after an action, at the bottom of the screen, in the app's glass (a pale danger
 * wash for errors, never a dark bar). Mounted once in the root; screens call `toast.saved(…)` /
 * `toast.failed(…)` from `@grimo/client`.
 */
export function Toaster() {
  const current = useToastStore((state) => state.current);
  const dismiss = useToastStore((state) => state.dismiss);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-28 z-50 flex justify-center lg:bottom-8"
    >
      {current && (
        <ToastCard key={current.id} toast={current} onClose={() => dismiss(current.id)} />
      )}
    </div>
  );
}

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const error = toast.tone === "error";
  return (
    <div
      role={error ? "alert" : "status"}
      className={cn(
        "pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl py-3 pr-2 pl-3.5 animate-[toast-in_.45s_cubic-bezier(.3,1.4,.5,1)_both] motion-reduce:animate-none",
        error ? "border border-danger/40 bg-danger-soft shadow-lg shadow-shadow" : "glass",
      )}
    >
      <Mark tone={toast.tone} />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "font-mono text-[10px] tracking-[0.12em] uppercase",
            error ? "text-danger" : "text-text-muted",
          )}
        >
          {KICKERS[toast.tone]}
        </p>
        <p className="line-clamp-3 text-[15px] font-semibold">{toast.message}</p>
      </div>
      {toast.action ? (
        <button
          type="button"
          onClick={() => {
            toast.action?.run();
            onClose();
          }}
          className={cn(
            "self-stretch border-l px-3 font-mono text-xs font-semibold tracking-wider uppercase transition hover:opacity-70",
            error ? "border-danger/40 text-danger" : "border-edge text-accent-ink",
          )}
        >
          {toast.action.label}
        </button>
      ) : (
        <button
          type="button"
          aria-label="Fechar aviso"
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-muted hover:text-text"
        >
          <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6 6 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

/** A check that draws itself (success), an "i" (info) or a "!" (error), in a round mark. */
function Mark({ tone }: { tone: ToastTone }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full text-accent-foreground animate-[shelf-pop_.45s_cubic-bezier(.3,1.6,.5,1)_both] motion-reduce:animate-none",
        tone === "error" ? "bg-danger" : "bg-accent-gradient",
      )}
    >
      {tone === "success" ? (
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="[stroke-dasharray:22] [stroke-dashoffset:22] animate-[toast-check_.35s_ease-out_.15s_forwards] motion-reduce:[stroke-dashoffset:0] motion-reduce:animate-none"
          />
        </svg>
      ) : (
        <span className="font-mono text-sm font-bold">{tone === "error" ? "!" : "i"}</span>
      )}
    </span>
  );
}
