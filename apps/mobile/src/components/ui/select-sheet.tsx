import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Icon } from "./icon";
import { Text } from "./text";

export interface SelectOption {
  value: string;
  label: string;
  /** Right side, muted: a count ("12"). */
  detail?: string;
  /** Under the label, muted ("só você vê"). */
  hint?: string;
}

/** The pill that opens a selector: "Física · 12 ▾". */
export function SelectButton({
  label,
  accessibilityLabel,
  onPress,
}: {
  label: string;
  accessibilityLabel?: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { borderColor: theme.border, backgroundColor: theme.surface, opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <Text numberOfLines={1} style={styles.buttonLabel}>
        {label}
      </Text>
      <Icon name="chevronDown" size={16} color="textMuted" />
    </Pressable>
  );
}

/**
 * A bottom sheet to pick one option (a shelf), with optional extra content (filters) and a
 * footer action ("+ Nova estante").
 */
export function SelectSheet({
  visible,
  title,
  options = [],
  value,
  onSelect,
  onClose,
  children,
  footer,
}: {
  visible: boolean;
  title: string;
  options?: SelectOption[];
  value?: string | null;
  onSelect?: (value: string) => void;
  onClose: () => void;
  /** Content under the options (filter chips). */
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        accessibilityLabel="Fechar"
        onPress={onClose}
        style={[styles.backdrop, { backgroundColor: theme.shadow }]}
      >
        <Pressable
          onPress={() => {}}
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surface,
              borderColor: theme.edge,
              paddingBottom: insets.bottom + spacing[4],
            },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: theme.border }]} />
          <Text variant="heading">{title}</Text>
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {options.map((option) => {
              const active = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    onSelect?.(option.value);
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor: active ? theme.surfaceMuted : "transparent",
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <View style={styles.grow}>
                    <Text style={active && styles.bold}>{option.label}</Text>
                    {option.hint && (
                      <Text variant="small" color="textMuted">
                        {option.hint}
                      </Text>
                    )}
                  </View>
                  {option.detail && (
                    <Text variant="label" color="textMuted">
                      {option.detail}
                    </Text>
                  )}
                  <Text color="accentInk" style={styles.check}>
                    {active ? "✓" : ""}
                  </Text>
                </Pressable>
              );
            })}
            {children}
          </ScrollView>
          {footer}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing[4],
    flexShrink: 1,
  },
  buttonLabel: { fontWeight: "700", flexShrink: 1 },
  backdrop: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    gap: spacing[3],
    maxHeight: "80%",
  },
  grabber: { width: 40, height: 5, borderRadius: radius.full, alignSelf: "center" },
  list: { flexGrow: 0 },
  listContent: { gap: spacing[1] },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
  },
  grow: { flex: 1 },
  bold: { fontWeight: "700" },
  check: { width: 16, textAlign: "right" },
});
