import { FEELING_LABELS, FEELINGS, type Feeling, MAX_FEELINGS, toggleFeeling } from "@grimo/core";
import { Pressable, StyleSheet, View } from "react-native";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Text } from "./text";

/**
 * Pick up to `MAX_FEELINGS` feelings. `suggested` (what the reading diary says) offers to fill
 * them in one tap while nothing is picked.
 */
export function FeelingPicker({
  value,
  onChange,
  suggested = [],
  label = "Como esse livro te fez sentir?",
}: {
  value: readonly Feeling[];
  onChange: (feelings: Feeling[]) => void;
  suggested?: readonly Feeling[];
  label?: string;
}) {
  const theme = useTheme();
  const full = value.length >= MAX_FEELINGS;
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text variant="small" color="textMuted" style={styles.flex}>
          {label}
        </Text>
        <Text variant="label" color="textMuted">
          {value.length}/{MAX_FEELINGS}
        </Text>
      </View>
      {value.length === 0 && suggested.length > 0 && (
        <Pressable accessibilityRole="button" onPress={() => onChange([...suggested])}>
          <Text variant="label" color="accentInk">
            Pelo seu diário: {suggested.map((feeling) => FEELING_LABELS[feeling]).join(", ")}
          </Text>
        </Pressable>
      )}
      <View style={styles.grid}>
        {FEELINGS.map((feeling) => {
          const picked = value.includes(feeling);
          const disabled = full && !picked;
          return (
            <Pressable
              key={feeling}
              accessibilityRole="button"
              accessibilityState={{ selected: picked, disabled }}
              disabled={disabled}
              onPress={() => onChange(toggleFeeling(value, feeling))}
              style={[
                styles.cell,
                picked
                  ? { backgroundColor: theme.glowB, borderColor: theme.accent, borderWidth: 2 }
                  : { backgroundColor: theme.background, borderColor: theme.border },
                disabled && styles.disabled,
              ]}
            >
              <Text
                variant="small"
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[styles.cellText, picked && styles.picked]}
              >
                {FEELING_LABELS[feeling]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Feelings shown on a card or a diary line. */
export function FeelingTags({ feelings }: { feelings: readonly Feeling[] }) {
  const theme = useTheme();
  if (feelings.length === 0) return null;
  return (
    <View style={styles.chips} accessibilityLabel="Sentimentos">
      {feelings.map((feeling) => (
        <View key={feeling} style={[styles.tag, { borderColor: theme.accent }]}>
          <Text variant="label" color="accentInk" style={styles.tagText}>
            {FEELING_LABELS[feeling]}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[2] },
  header: { flexDirection: "row", alignItems: "baseline", gap: spacing[2] },
  flex: { flex: 1 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing[1] },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  // Four per row: (100% - 3 gaps) / 4.
  cell: {
    width: "23.6%",
    flexGrow: 1,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.sm + 4,
    paddingHorizontal: 2,
    paddingVertical: spacing[2],
  },
  cellText: { fontSize: 13 },
  picked: { fontWeight: "700" },
  disabled: { opacity: 0.4 },
  tag: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  tagText: { fontSize: 10 },
});
