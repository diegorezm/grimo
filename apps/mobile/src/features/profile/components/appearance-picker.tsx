import { THEME_LABELS, THEME_PREFERENCES } from "@grimo/core";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useThemeStore } from "@/lib/theme";

/** Segmented control: Sistema / Claro / Escuro. */
export function AppearancePicker() {
  const theme = useTheme();
  const { preference, setPreference } = useThemeStore();

  return (
    <View style={styles.root}>
      <Text variant="label" color="textMuted">
        Aparência
      </Text>
      <View style={[styles.group, { borderColor: theme.border }]}>
        {THEME_PREFERENCES.map((option) => {
          const active = option === preference;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setPreference(option)}
              style={[styles.option, active && { backgroundColor: theme.primary }]}
            >
              <Text variant="label" color={active ? "primaryForeground" : "textMuted"}>
                {THEME_LABELS[option]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[2] },
  group: { flexDirection: "row", borderWidth: 1, borderRadius: radius.md, padding: 2 },
  option: {
    flex: 1,
    alignItems: "center",
    borderRadius: radius.sm,
    paddingVertical: spacing[2],
  },
});
