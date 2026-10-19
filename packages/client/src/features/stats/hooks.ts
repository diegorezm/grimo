import { toMonthKey } from "@grimo/core";
import { queryOptions, useQuery } from "@tanstack/react-query";
import type { ApiClient } from "../../lib/api-client";
import { useApi } from "../../lib/api-context";
import { parseResponse, queryKeys, staleTimes } from "../../lib/query";

export function yearOverviewQuery(api: ApiClient, year = new Date().getUTCFullYear()) {
  return queryOptions({
    queryKey: queryKeys.yearOverview(year),
    queryFn: () => parseResponse(api.stats.overview.$get({ query: { year: String(year) } })),
    staleTime: staleTimes.own,
  });
}

/** Data for the shareable "resumo do mês" card. Months that are over barely change. */
export function monthlySummaryQuery(api: ApiClient, month = toMonthKey(new Date())) {
  return queryOptions({
    queryKey: queryKeys.monthlySummary(month),
    queryFn: () => parseResponse(api.stats.monthly.$get({ query: { month } })),
    staleTime: month < toMonthKey(new Date()) ? staleTimes.pastMonth : staleTimes.own,
  });
}

export function useYearOverview(year?: number) {
  return useQuery(yearOverviewQuery(useApi(), year));
}

export function useMonthlySummary(month?: string) {
  return useQuery(monthlySummaryQuery(useApi(), month));
}
