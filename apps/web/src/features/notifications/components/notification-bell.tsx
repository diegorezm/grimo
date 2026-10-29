import { useUnreadNotifications } from "@grimo/client";
import { unreadBadge } from "@grimo/core";
import { Link } from "@tanstack/react-router";
import { BellIcon } from "@/components/ui/icons";
import { cn } from "@/utils/cn";

/** Bell with the unread count; opens the notifications. */
export function NotificationBell({ className }: { className?: string }) {
  const unread = useUnreadNotifications().data ?? 0;
  return (
    <Link
      to="/notifications"
      aria-label={unread > 0 ? `Notificações, ${unread} novas` : "Notificações"}
      className={cn(
        "relative grid size-10 place-items-center rounded-full text-text-muted transition hover:bg-surface-muted hover:text-text",
        className,
      )}
      activeProps={{ className: "bg-surface-muted text-accent" }}
    >
      <BellIcon className="size-6" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-5 rounded-full bg-accent px-1.5 py-0.5 text-center font-mono text-[10px] leading-none font-semibold text-accent-foreground">
          {unreadBadge(unread)}
        </span>
      )}
    </Link>
  );
}
