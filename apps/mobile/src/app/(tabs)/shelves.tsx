import { Screen, Text } from "@/components/ui";
import { ShelfBoard } from "@/features/shelves";

export default function ShelvesScreen() {
  return (
    <Screen>
      <Text variant="heading">Estantes</Text>
      <ShelfBoard />
    </Screen>
  );
}
