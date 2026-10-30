import {
  activeSessionQuery,
  feedQuery,
  friendsWantQuery,
  monthlySummaryQuery,
  shelfQuery,
  streakQuery,
  trendingQuery,
  yearOverviewQuery,
} from "@grimo/client";
import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/features/dashboard";

export const Route = createFileRoute("/_app/")({
  // Warm the cache (on hover, too). Not awaited: navigation never waits on the network.
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(shelfQuery());
    void queryClient.prefetchQuery(yearOverviewQuery());
    void queryClient.prefetchQuery(monthlySummaryQuery());
    void queryClient.prefetchQuery(feedQuery());
    void queryClient.prefetchQuery(friendsWantQuery());
    void queryClient.prefetchQuery(trendingQuery());
    void queryClient.prefetchQuery(streakQuery());
    void queryClient.prefetchQuery(activeSessionQuery());
  },
  component: Dashboard,
});
