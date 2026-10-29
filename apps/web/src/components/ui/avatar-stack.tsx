import { cn } from "@/utils/cn";
import { Avatar } from "./avatar";

/** Overlapping avatars for "who else": the first `max`, in order. */
export function AvatarStack({
  people,
  max = 3,
  className,
}: {
  people: { id: string; name: string; image: string | null }[];
  max?: number;
  className?: string;
}) {
  return (
    <span className={cn("flex -space-x-2", className)} aria-hidden="true">
      {people.slice(0, max).map((person) => (
        <span key={person.id} className="rounded-full ring-2 ring-surface">
          <Avatar src={person.image} name={person.name} size="size-7" />
        </span>
      ))}
    </span>
  );
}
