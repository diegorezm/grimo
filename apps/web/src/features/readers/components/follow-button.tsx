import { useToggleFollow } from "@grimo/client";
import { useState } from "react";
import { CheckIcon } from "@/components/ui/icons";
import { cn } from "@/utils/cn";

/**
 * Follow / following toggle. While following, hovering shows what a click does ("Deixar de
 * seguir"). Render it only for signed-in readers on community instances, never for yourself.
 */
export function FollowButton({
  reader,
  size = "md",
  className,
}: {
  reader: { id: string; name: string; isFollowing: boolean; followsYou?: boolean };
  size?: "sm" | "md";
  className?: string;
}) {
  const toggle = useToggleFollow();
  const [hover, setHover] = useState(false);
  const { isFollowing } = reader;
  const label = isFollowing
    ? hover
      ? "Deixar de seguir"
      : "Seguindo"
    : reader.followsYou
      ? "Seguir de volta"
      : "Seguir";

  return (
    <button
      type="button"
      aria-pressed={isFollowing}
      aria-label={isFollowing ? `Deixar de seguir ${reader.name}` : `Seguir ${reader.name}`}
      onClick={() => toggle.mutate({ userId: reader.id, follow: !isFollowing })}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full font-mono font-medium uppercase tracking-wider transition",
        size === "sm" ? "min-w-28 px-3.5 py-1.5 text-[10px]" : "min-w-36 px-5 py-2.5 text-xs",
        isFollowing
          ? "border border-border bg-surface text-text hover:border-danger/40 hover:bg-danger/10 hover:text-danger"
          : "bg-accent-gradient text-accent-foreground shadow-md shadow-accent/30 hover:opacity-90",
        className,
      )}
    >
      {isFollowing && !hover && <CheckIcon className="size-3.5" />}
      {label}
    </button>
  );
}
