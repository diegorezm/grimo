import { useGroupCard } from "@grimo/client";
import { PaletteStudio } from "@/features/stats";
import { GroupCard } from "./group-card";

/** The group's card for Stories: pick the colors (shared with the monthly card), then share. */
export function GroupCardStudio({ id }: { id: string }) {
  const data = useGroupCard(id);
  return (
    <PaletteStudio
      title="Card do grupo"
      note={
        data?.finished
          ? "Todo mundo terminou: o card virou “Terminamos juntos”."
          : "Quando todo mundo terminar, o card vira “Terminamos juntos”."
      }
      shareTitle={data?.headline ?? "Lendo juntos"}
    >
      {data && ((palette) => <GroupCard data={data} palette={palette} />)}
    </PaletteStudio>
  );
}
