import { useShelf, useShelfTabStore } from "@grimo/client";
import { countByShelf } from "@grimo/core";
import { Spinner } from "@/components/feedback/spinner";
import { FeedPanel } from "@/features/feed";
import { ShelfTiles } from "@/features/shelves";
import { GoalHero } from "./goal-hero";
import { MonthList } from "./month-list";
import { ShelfCarousel } from "./shelf-carousel";

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
    <div className="grid grid-cols-1 gap-8 px-4 pt-2 @5xl/main:grid-cols-[minmax(0,1fr)_22rem] @5xl/main:gap-6 lg:px-8 lg:pt-6 lg:pb-8">
      <div className="flex min-w-0 flex-col gap-9">
        <ShelfTiles counts={counts} selected={status} onSelect={setStatus} />
        <ShelfCarousel
          status={status}
          items={items.filter(({ entry }) => entry.status === status)}
        />
        <div className="grid grid-cols-1 gap-8 @6xl/main:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] @6xl/main:items-start">
          <GoalHero />
          <MonthList />
        </div>
      </div>
      <FeedPanel className="h-[36rem] @5xl/main:sticky @5xl/main:top-6 @5xl/main:h-[calc(100dvh-8.5rem)]" />
    </div>
  );
}
