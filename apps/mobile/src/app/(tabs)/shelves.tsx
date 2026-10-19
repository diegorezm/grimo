import { Screen, Text } from "@/components/ui";
import { ShelfBoard } from "@/features/shelves";

export default function ShelvesScreen() {
  return (
    <Screen>
      <Text variant="display">Estantes</Text>
      <ShelfBoard />
    </Screen>
  );
}
