import { useToggleFollow } from "@grimo/client";
import { useState } from "react";
import { CheckIcon } from "@/components/ui/icons";
import { cn } from "@/utils/cn";

/**
 * Follow / following toggle. While following, hovering shows what a click does ("Deixar de
 * seguir"). Render it only for signed-in readers, never for yourself.
 */
export function FollowButton({
  reader,
  size = "md",
  className,
}: {
  reader: {
    id: string;
    name: string;
    isFollowing: boolean;
    followsYou?: boolean;
    /** Asked to follow a private reader, not answered yet: a click withdraws it. */
    requested?: boolean;
  };
  size?: "sm" | "md";
  className?: string;
}) {
  const toggle = useToggleFollow();
  const [hover, setHover] = useState(false);
  const { isFollowing } = reader;
  // A pending request looks and acts like "Seguindo": clicking it takes the request back.
  const on = isFollowing || Boolean(reader.requested);
  const label = isFollowing
    ? hover
      ? "Deixar de seguir"
      : "Seguindo"
    : reader.requested
      ? hover
        ? "Cancelar pedido"
        : "Solicitado"
      : reader.followsYou
        ? "Seguir de volta"
        : "Seguir";

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={
        isFollowing
          ? `Deixar de seguir ${reader.name}`
          : reader.requested
            ? `Cancelar o pedido para seguir ${reader.name}`
            : `Seguir ${reader.name}`
      }
      onClick={() => toggle.mutate({ userId: reader.id, follow: !on })}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full font-mono font-medium uppercase tracking-wider transition",
        size === "sm" ? "min-w-28 px-3.5 py-1.5 text-[10px]" : "min-w-36 px-5 py-2.5 text-xs",
        on
          ? "border border-border bg-surface text-text hover:border-danger/40 hover:bg-danger/10 hover:text-danger"
          : "bg-accent-gradient text-accent-foreground shadow-md shadow-accent/30 hover:opacity-90",
        className,
      )}
    >
      {on && !hover && <CheckIcon className="size-3.5" />}
      {label}
    </button>
  );
}
