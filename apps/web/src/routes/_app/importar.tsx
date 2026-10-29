import { latestImportQuery } from "@grimo/client";
import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/layout/screen";
import { GoodreadsImport } from "@/features/imports";

export const Route = createFileRoute("/_app/importar")({
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(latestImportQuery());
  },
  component: () => (
    <Screen back="Voltar" title="Trazer suas estantes" subtitle="Sem recomeçar do zero.">
      <GoodreadsImport />
    </Screen>
  ),
});
