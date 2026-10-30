import { cn } from "@/utils/cn";

const LABELS = { admin: "Admin", moderator: "Moderador" } as const;

/** Public mark on readers who are on the moderation team (`role` from the backend). */
export function StaffBadge({
  role,
  className,
}: {
  role?: "admin" | "moderator" | null;
  className?: string;
}) {
  if (!role) return null;
  return (
    <span
      title={role === "admin" ? "Administra o Grimo" : "Faz parte da moderação do Grimo"}
      className={cn(
        "rounded-sm border border-accent px-1.5 py-px align-middle font-mono text-[10px] font-medium uppercase tracking-wider text-accent",
        className,
      )}
    >
      {LABELS[role]}
    </span>
  );
}
