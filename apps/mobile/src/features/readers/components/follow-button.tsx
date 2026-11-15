import { useToggleFollow } from "@grimo/client";
import { Button } from "@/components/ui";

/** Follow / unfollow, optimistic: every cached list and page shows the new state at once. */
export function FollowButton({
  userId,
  isFollowing,
  followsYou,
  requested,
  compact,
}: {
  userId: string;
  isFollowing: boolean;
  followsYou?: boolean;
  /** Asked to follow a private reader, not answered yet: a tap withdraws it. */
  requested?: boolean;
  compact?: boolean;
}) {
  const toggleFollow = useToggleFollow();
  const on = isFollowing || Boolean(requested);
  const title = isFollowing
    ? "Seguindo"
    : requested
      ? "Solicitado"
      : followsYou
        ? "Seguir de volta"
        : "Seguir";
  return (
    <Button
      title={title}
      variant={on ? "secondary" : "primary"}
      accessibilityLabel={
        isFollowing ? "Deixar de seguir" : requested ? "Cancelar o pedido para seguir" : title
      }
      onPress={() => toggleFollow.mutate({ userId, follow: !on })}
      style={compact ? { paddingHorizontal: 14, paddingVertical: 8 } : undefined}
    />
  );
}
