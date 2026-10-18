import { toMonthKey } from "@grimo/core";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "../../lib/api-context";
import { parseResponse, queryKeys } from "../../lib/query";

export function useYearOverview(year = new Date().getUTCFullYear()) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.yearOverview(year),
    queryFn: () => parseResponse(api.stats.overview.$get({ query: { year: String(year) } })),
  });
}

/** Data for the shareable "resumo do mês" card. */
export function useMonthlySummary(month = toMonthKey(new Date())) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.monthlySummary(month),
    queryFn: () => parseResponse(api.stats.monthly.$get({ query: { month } })),
  });
}
