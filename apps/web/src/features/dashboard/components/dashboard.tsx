import { useShelf, useShelfTabStore } from "@grimo/client";
import { countByShelf } from "@grimo/core";
import { Spinner } from "@/components/feedback/spinner";
import { FeedPanel } from "@/features/feed";
import { GoalHero } from "./goal-hero";
import { MonthList } from "./month-list";
import { ShelfCarousel } from "./shelf-carousel";
import { ShelfTiles } from "./shelf-tiles";

/**
 * Home: shelf tiles pick the carousel of books; goal and month highlights below; the feed
 * runs down the side column (below everything on small screens).
 */
export function Dashboard() {
  const shelf = useShelf();
  const { status, setStatus } = useShelfTabStore();

  if (shelf.isPending) return <Spinner />;
  const items = shelf.data?.items ?? [];
  const counts = countByShelf(items.map(({ entry }) => entry));

  return (
    <div className="grid grid-cols-1 gap-8 px-4 pt-2 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-6 lg:px-8 lg:pt-6 lg:pb-8">
      <div className="flex min-w-0 flex-col gap-9">
        <ShelfTiles counts={counts} selected={status} onSelect={setStatus} />
        <ShelfCarousel
          status={status}
          items={items.filter(({ entry }) => entry.status === status)}
        />
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] xl:items-start">
          <GoalHero />
          <MonthList />
        </div>
      </div>
      <FeedPanel className="h-[36rem] lg:sticky lg:top-6 lg:h-[calc(100dvh-8.5rem)]" />
    </div>
  );
}
