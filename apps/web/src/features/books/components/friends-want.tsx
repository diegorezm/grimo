import { friendsWantLabel } from "@grimo/core";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { cn } from "@/utils/cn";

/** "Bia e Caio querem ler", with their faces: the people you follow who want this book. */
export function FriendsWant({
  friends,
  className,
}: {
  friends: { id: string; name: string; image: string | null }[];
  className?: string;
}) {
  if (friends.length === 0) return null;
  return (
    <p className={cn("flex items-center gap-2 text-sm text-text-muted", className)}>
      <AvatarStack people={friends} />
      {friendsWantLabel(friends.map((friend) => friend.name))}
    </p>
  );
}
