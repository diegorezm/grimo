import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { Text } from "./text";

/** 1–5 star rating. With `onChange` it is an input (tap the same star again to clear). */
export function Stars({
  value,
  onChange,
  size = 18,
}: {
  value: number | null;
  onChange?: (value: number | null) => void;
  size?: number;
}) {
  const theme = useTheme();
  return (
    <View style={styles.row} accessibilityLabel={`${value ?? 0} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const star = (
          <Text style={{ fontSize: size, color: n <= (value ?? 0) ? theme.gold : theme.border }}>
            ★
          </Text>
        );
        if (!onChange) return <View key={n}>{star}</View>;
        return (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityLabel={`${n} estrela${n > 1 ? "s" : ""}`}
            hitSlop={6}
            onPress={() => onChange(value === n ? null : n)}
            style={styles.touch}
          >
            {star}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 2, alignItems: "center" },
  touch: { minWidth: 36, minHeight: 44, alignItems: "center", justifyContent: "center" },
});
