import { useToggleFollow } from "@grimo/client";
import { Button } from "@/components/ui";

/** Follow / unfollow, optimistic: every cached list and page shows the new state at once. */
export function FollowButton({
  userId,
  isFollowing,
  followsYou,
  compact,
}: {
  userId: string;
  isFollowing: boolean;
  followsYou?: boolean;
  compact?: boolean;
}) {
  const toggleFollow = useToggleFollow();
  const title = isFollowing ? "Seguindo" : followsYou ? "Seguir de volta" : "Seguir";
  return (
    <Button
      title={title}
      variant={isFollowing ? "secondary" : "primary"}
      accessibilityLabel={isFollowing ? "Deixar de seguir" : title}
      onPress={() => toggleFollow.mutate({ userId, follow: !isFollowing })}
      style={compact ? { paddingHorizontal: 14, paddingVertical: 8 } : undefined}
    />
  );
}
