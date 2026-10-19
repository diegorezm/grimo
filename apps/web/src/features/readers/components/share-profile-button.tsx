import { useEffect, useState } from "react";
import { CheckIcon, ShareIcon } from "@/components/ui/icons";
import { cn } from "@/utils/cn";

/** Public link to a reader's page (opens for anyone, signed in or not). */
export function profileUrl(username: string) {
  return `${window.location.origin}/u/${username}`;
}

/**
 * Shares the profile link: the system share sheet on touch devices, otherwise copies the link
 * and says so.
 */
export function ShareProfileButton({
  username,
  name,
  own = false,
  className,
}: {
  username: string;
  name: string;
  /** Your own profile: the share text speaks in the first person. */
  own?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function share() {
    const url = profileUrl(username);
    const text = own ? "Acompanhe minhas leituras" : `As leituras de ${name}`;
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title: name, text, url });
        return;
      } catch {
        // Cancelled or not allowed: copy instead.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("Copie o link do perfil:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      title={own ? "Compartilhar meu perfil" : `Compartilhar o perfil de ${name}`}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-surface py-2.5 pr-5 pl-4 font-mono text-xs font-medium uppercase tracking-wider shadow-sm shadow-shadow transition hover:-translate-y-0.5 hover:border-accent/50 hover:text-accent hover:shadow-md",
        className,
      )}
    >
      {copied ? <CheckIcon className="size-4" /> : <ShareIcon className="size-4" />}
      <span aria-live="polite">{copied ? "Link copiado" : "Compartilhar"}</span>
    </button>
  );
}
