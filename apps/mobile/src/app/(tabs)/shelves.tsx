import { StyleSheet, View } from "react-native";
import { ShelfBoard, ShelfSelectBar } from "@/features/shelves";

/** Estantes: the bookcase fills the screen; the selection bar floats over it. */
export default function ShelvesScreen() {
  return (
    <View style={styles.root}>
      <ShelfBoard />
      <ShelfSelectBar />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
