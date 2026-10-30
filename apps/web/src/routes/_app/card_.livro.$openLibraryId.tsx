import { bookQuery } from "@grimo/client";
import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/layout/screen";
import { FinishedCardStudio } from "@/features/stats";

export const Route = createFileRoute("/_app/card_/livro/$openLibraryId")({
  loader: ({ context: { queryClient }, params: { openLibraryId } }) => {
    void queryClient.prefetchQuery(bookQuery(openLibraryId));
  },
  component: FinishedCardPage,
});

function FinishedCardPage() {
  const { openLibraryId } = Route.useParams();
  return (
    <Screen
      back="Livro"
      title="Terminei de ler"
      subtitle="Para os Stories, o WhatsApp ou onde quiser."
    >
      <FinishedCardStudio openLibraryId={openLibraryId} />
    </Screen>
  );
}
