import { useFeed } from "@grimo/client";
import { Spinner } from "@/components/feedback/spinner";
import { LoadMore } from "@/components/ui/load-more";
import { FeedItem } from "./feed-item";

export function FeedList() {
  const feed = useFeed();
  const items = feed.data?.items ?? [];

  if (feed.isPending) return <Spinner />;
  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-text-muted">
        Seu feed está vazio. Adicione livros às estantes ou siga outros leitores.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <FeedItem key={item.id} item={item} />
      ))}
      <LoadMore {...feed} />
    </div>
  );
}
