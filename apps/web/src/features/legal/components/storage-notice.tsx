// Not named cookie-*: ad blockers block dev module URLs like /cookie-notice.tsx.
import { Link } from "@tanstack/react-router";
import { useState } from "react";

export const COOKIE_NOTICE_KEY = "grimo.cookie-notice";

function seen() {
  try {
    return window.localStorage.getItem(COOKIE_NOTICE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * First-visit notice about local storage. Informative, not a consent banner: Grimo only stores
 * what it needs to work (session, cache, theme), which needs transparency, not consent (ANPD
 * cookie guide). If something non-essential is ever added (analytics…), this must become a real
 * choice, with "Rejeitar" as visible as "Aceitar" (docs/legal/README.md).
 */
export function CookieNotice() {
  const [open, setOpen] = useState(() => !seen());
  if (!open) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(COOKIE_NOTICE_KEY, "1");
    } catch {}
    setOpen(false);
  }

  return (
    <section
      aria-label="Aviso de cookies"
      className="glass fixed inset-x-4 bottom-28 z-30 mx-auto flex max-w-xl flex-col gap-3 rounded-xl p-4 text-sm shadow-lg sm:flex-row sm:items-center lg:bottom-6"
    >
      <p className="flex-1 leading-relaxed">
        O Grimo usa só armazenamento necessário para funcionar (sua sessão, o cache das telas e o
        tema). Nada de rastreamento ou publicidade.{" "}
        <Link
          to="/privacidade"
          hash="armazenamento"
          className="text-accent underline underline-offset-4"
        >
          Saiba mais
        </Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="bg-accent-gradient self-end rounded-full px-5 py-2 font-mono text-xs font-medium uppercase tracking-wider text-accent-foreground sm:self-auto"
      >
        Entendi
      </button>
    </section>
  );
}
