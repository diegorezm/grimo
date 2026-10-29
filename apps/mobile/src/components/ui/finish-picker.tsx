import { FINISH_PRESETS, finishByIn } from "@grimo/core";
import { Pressable, StyleSheet, View } from "react-native";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Text } from "./text";

/**
 * "Terminar em": no date, or one of the presets (2 semanas, 1 mês…). Controlled by `days`
 * (`undefined`: nothing picked yet).
 */
export function FinishPicker({
  days,
  onChange,
}: {
  days: number | null | undefined;
  onChange: (days: number | null) => void;
}) {
  const theme = useTheme();
  const options = [{ days: null, label: "Sem data" }, ...FINISH_PRESETS];
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const active = days === option.days;
        return (
          <Pressable
            key={option.label}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.days)}
            style={[
              styles.chip,
              { borderColor: active ? theme.accent : theme.border },
              active && { backgroundColor: theme.surfaceMuted },
            ]}
          >
            <Text variant="label" color={active ? "accent" : "textMuted"}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** The date a picked preset means (end of that day). */
export const finishByFor = (days: number | null) =>
  days === null ? null : finishByIn(days, new Date());

/** "30 de novembro". */
export const formatFinishBy = (ms: number) =>
  new Date(ms).toLocaleDateString("pt-BR", { day: "numeric", month: "long" });

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  chip: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
});
