import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/layout/screen";
import { ShelfBoard } from "@/features/shelves";

export const Route = createFileRoute("/_app/shelves")({
  component: () => (
    <Screen title="Estantes">
      <ShelfBoard />
    </Screen>
  ),
});
