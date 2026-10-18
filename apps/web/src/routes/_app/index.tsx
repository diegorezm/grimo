import { createFileRoute } from "@tanstack/react-router";
import { FeedList } from "@/features/feed";

export const Route = createFileRoute("/_app/")({
  component: FeedList,
});
