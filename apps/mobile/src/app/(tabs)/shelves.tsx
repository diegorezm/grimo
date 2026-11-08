import { StyleSheet, View } from "react-native";
import { Screen } from "@/components/ui";
import { ShelfBoard, ShelfSelectBar } from "@/features/shelves";

/** Estantes. The selection bar floats over the screen, outside its scroll. */
export default function ShelvesScreen() {
  return (
    <View style={styles.root}>
      <Screen>
        <ShelfBoard />
      </Screen>
      <ShelfSelectBar />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
