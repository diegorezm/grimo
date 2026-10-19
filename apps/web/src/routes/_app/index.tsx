import { feedQuery, monthlySummaryQuery, shelfQuery, yearOverviewQuery } from "@grimo/client";
import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/features/dashboard";

export const Route = createFileRoute("/_app/")({
  // Warm the cache (on hover, too). Not awaited: navigation never waits on the network.
  loader: ({ context: { queryClient, api } }) => {
    void queryClient.prefetchQuery(shelfQuery(api));
    void queryClient.prefetchQuery(yearOverviewQuery(api));
    void queryClient.prefetchQuery(monthlySummaryQuery(api));
    void queryClient.prefetchInfiniteQuery(feedQuery(api));
  },
  component: Dashboard,
});
