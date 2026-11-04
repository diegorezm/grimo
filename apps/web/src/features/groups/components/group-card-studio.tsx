import { useGroupCard } from "@grimo/client";
import { Spinner } from "@/components/feedback/spinner";
import { PaletteStudio } from "@/features/stats";
import { GroupCard } from "./group-card";

/** The group's card for Stories: pick the colors (shared with the monthly card), then share. */
export function GroupCardStudio({ id }: { id: string }) {
  const data = useGroupCard(id);
  if (!data) return <Spinner />;
  return (
    <PaletteStudio
      fileName={`grimo-juntos-${data.finished ? "terminamos" : "lendo"}.png`}
      shareTitle={data.headline}
      note={
        data.finished
          ? "Todo mundo terminou: o card virou “Terminamos juntos”."
          : "Quando todo mundo terminar, o card vira “Terminamos juntos”."
      }
    >
      {(palette) => <GroupCard data={data} palette={palette} />}
    </PaletteStudio>
  );
}
