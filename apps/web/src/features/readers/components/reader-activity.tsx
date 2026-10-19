import { useReaderActivity } from "@grimo/client";
import { groupActivities } from "@grimo/core";
import { Spinner } from "@/components/feedback/spinner";
import { LoadMore } from "@/components/ui/load-more";
import { FeedItem } from "@/features/feed";

/**
 * A reader's own timeline: notes, reviews, progress, finished books, follows. Repeated
 * activities collapse into one entry, and older pages load as it scrolls.
 */
export function ReaderActivity({
  username,
  interactive,
}: {
  username: string;
  interactive: boolean;
}) {
  const activity = useReaderActivity(username);
  const items = activity.data?.pages.flatMap((page) => page.items) ?? [];
  const groups = groupActivities(items);

  if (activity.isPending) return <Spinner />;
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-text-muted">Nenhuma atividade ainda.</p>;
  }

  return (
    <div className="flex flex-col">
      {groups.map(({ id, items: [item, ...more] }) => (
        <FeedItem key={id} item={item!} more={more} interactive={interactive} />
      ))}
      <LoadMore {...activity} />
    </div>
  );
}
