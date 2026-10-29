import { buildCardData, type CardData, type CardPeriod, previousPeriod } from "@grimo/core";
import { useMe } from "../profiles/hooks";
import { useMonthlySummary, useYearlySummary } from "./hooks";

function useSummary(period: CardPeriod) {
  const month = useMonthlySummary(period.kind === "month" ? period.month : undefined, {
    enabled: period.kind === "month",
  });
  const year = useYearlySummary(period.kind === "year" ? period.year : undefined, {
    enabled: period.kind === "year",
  });
  return period.kind === "month" ? month.data : year.data;
}

/** A month's or a year's numbers, plus the period before (deltas), shaped for the card. */
export function useCardData(period: CardPeriod): CardData | null {
  const current = useSummary(period);
  const before = useSummary(previousPeriod(period));
  const me = useMe().data;
  if (!current || !me) return null;
  return buildCardData(period, current, before ?? null, me);
}
