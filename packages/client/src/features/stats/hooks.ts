import { api } from "@grimo/backend";
import { toMonthKey, yearOf } from "@grimo/core";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "../../lib/convex-cache";

export function yearOverviewQuery(year = yearOf(new Date())) {
  return convexQuery(api.stats.overview, { year }, "required");
}

/** Data for the shareable "resumo do mês" card. */
export function monthlySummaryQuery(month = toMonthKey(new Date())) {
  return convexQuery(api.stats.monthly, { month }, "required");
}

export function useYearOverview(year?: number, options: { enabled?: boolean } = {}) {
  return useQuery({ ...yearOverviewQuery(year), ...options });
}

export function useMonthlySummary(month?: string) {
  return useQuery(monthlySummaryQuery(month));
}
