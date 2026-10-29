import { meQuery, monthlySummaryQuery, yearlySummaryQuery } from "@grimo/client";
import { shiftMonth, toMonthKey } from "@grimo/core";
import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/layout/screen";
import { CardStudio } from "@/features/stats";

export const Route = createFileRoute("/_app/card")({
  // `?year=2026` opens the studio on that year's retrospectiva.
  validateSearch: (search: Record<string, unknown>): { year?: number } => ({
    year: Number.isInteger(search.year) ? (search.year as number) : undefined,
  }),
  loaderDeps: ({ search }) => ({ year: search.year }),
  loader: ({ context: { queryClient }, deps }) => {
    void queryClient.prefetchQuery(meQuery());
    if (deps.year) {
      void queryClient.prefetchQuery(yearlySummaryQuery(deps.year));
      void queryClient.prefetchQuery(yearlySummaryQuery(deps.year - 1));
      return;
    }
    const month = toMonthKey(new Date());
    void queryClient.prefetchQuery(monthlySummaryQuery(month));
    void queryClient.prefetchQuery(monthlySummaryQuery(shiftMonth(month, -1)));
  },
  component: CardPage,
});

function CardPage() {
  const { year } = Route.useSearch();
  return (
    <Screen
      back="Voltar"
      title={year ? `Retrospectiva ${year}` : "Card do mês"}
      subtitle="Escolha um modelo e as cores, e compartilhe nos Stories."
    >
      <CardStudio year={year} />
    </Screen>
  );
}
