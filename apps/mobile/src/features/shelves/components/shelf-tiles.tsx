import { useShelf, useShelfTabStore } from "@grimo/client";
import { countByShelf, SHELF_LABELS, SHELF_STATUSES, type ShelfStatus } from "@grimo/core";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/**
 * One ruler with a column per shelf and its count (neutral: the numbers are the point).
 * Tapping selects that shelf (shared store with the web), then `onSelect` lets the screen react
 * (e.g. open the Estantes tab).
 */
export function ShelfTiles({ onSelect }: { onSelect?: (status: ShelfStatus) => void }) {
  const theme = useTheme();
  const { setStatus } = useShelfTabStore();
  const counts = countByShelf((useShelf().data?.items ?? []).map(({ entry }) => entry));

  return (
    <View style={[styles.ruler, { borderColor: theme.edge }]}>
      {SHELF_STATUSES.map((status, index) => (
        <Pressable
          key={status}
          accessibilityRole="button"
          accessibilityLabel={`${SHELF_LABELS[status]}: ${counts[status]} livros`}
          onPress={() => {
            setStatus(status);
            onSelect?.(status);
          }}
          style={({ pressed }) => [
            styles.cell,
            index > 0 && { borderLeftWidth: 1, borderLeftColor: theme.edge },
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text variant="number" style={styles.count}>
            {counts[status]}
          </Text>
          <Text variant="small" color="textMuted" numberOfLines={1} style={styles.name}>
            {SHELF_LABELS[status]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  ruler: { flexDirection: "row", borderWidth: 1, borderRadius: radius.md },
  cell: { flex: 1, padding: spacing[3], gap: 2 },
  count: { fontSize: 22 },
  name: { fontSize: 12 },
});
