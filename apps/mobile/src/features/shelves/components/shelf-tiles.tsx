import { useShelf, useShelfTabStore } from "@grimo/client";
import { countByShelf, SHELF_LABELS, SHELF_STATUSES, type ShelfStatus } from "@grimo/core";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui";
import { radius, shelfBadges, spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

/**
 * One tile per shelf with its count. Tapping selects that shelf (shared store with the web),
 * then `onSelect` lets the screen react (e.g. open the Estantes tab).
 */
export function ShelfTiles({ onSelect }: { onSelect?: (status: ShelfStatus) => void }) {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const { status: selected, setStatus } = useShelfTabStore();
  const counts = countByShelf((useShelf().data?.items ?? []).map(({ entry }) => entry));

  return (
    <View style={styles.grid}>
      {SHELF_STATUSES.map((status) => {
        const badge = shelfBadges[scheme][status];
        const active = status === selected;
        return (
          <Pressable
            key={status}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${SHELF_LABELS[status]}: ${counts[status]} livros`}
            onPress={() => {
              setStatus(status);
              onSelect?.(status);
            }}
            style={[
              styles.tile,
              { backgroundColor: badge.bg, borderColor: active ? badge.fg : badge.border },
            ]}
          >
            <Text variant="number" style={[styles.count, { color: badge.fg }]}>
              {counts[status]}
            </Text>
            <Text variant="label" style={{ color: badge.fg }} numberOfLines={1}>
              {SHELF_LABELS[status]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  tile: {
    flexBasis: "47%",
    flexGrow: 1,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing[3],
    gap: 2,
    minHeight: 72,
  },
  count: { fontSize: 26 },
});
