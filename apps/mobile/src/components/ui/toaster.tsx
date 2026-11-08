import { type Toast, useToastStore } from "@grimo/client";
import { useEffect, useRef } from "react";
import { AccessibilityInfo, Animated, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Text } from "./text";

const MARKS = { success: "✓", info: "↻", error: "!" } as const;

/**
 * The notice after an action, above the tab bar. Mounted once in the root layout; screens call
 * `toast.saved(…)` / `toast.failed(…)` from `@grimo/client`.
 */
export function Toaster() {
  const current = useToastStore((state) => state.current);
  const dismiss = useToastStore((state) => state.dismiss);
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!current) return;
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    AccessibilityInfo.announceForAccessibility(current.message);
  }, [current, opacity]);

  if (!current) return null;
  return (
    <View pointerEvents="box-none" style={[styles.host, { bottom: insets.bottom + 72 }]}>
      <Animated.View
        style={{
          opacity,
          transform: [
            { translateY: opacity.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
          ],
        }}
      >
        <ToastCard toast={current} onClose={() => dismiss(current.id)} />
      </Animated.View>
    </View>
  );
}

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const theme = useTheme();
  const error = toast.tone === "error";
  // An error stays on the page color with a danger edge, so it reads apart from a success.
  const background = error ? theme.surface : theme.inverse;
  const foreground = error ? theme.text : theme.inverseForeground;
  const mark = error ? theme.danger : toast.tone === "success" ? theme.success : theme.accent;
  return (
    <Pressable
      accessibilityRole="alert"
      accessibilityHint="Toque para fechar"
      onPress={onClose}
      style={[
        styles.card,
        {
          backgroundColor: background,
          borderColor: error ? theme.danger : background,
          shadowColor: theme.shadow,
        },
      ]}
    >
      <View style={[styles.mark, { backgroundColor: mark }]}>
        <Text style={[styles.markText, { color: theme.surface }]}>{MARKS[toast.tone]}</Text>
      </View>
      <Text style={[styles.message, { color: foreground }]} numberOfLines={3}>
        {toast.message}
      </Text>
      {toast.action && (
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => {
            toast.action?.run();
            onClose();
          }}
          style={styles.action}
        >
          <Text variant="label" style={{ color: foreground, textDecorationLine: "underline" }}>
            {toast.action.label}
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  host: { position: "absolute", left: spacing[4], right: spacing[4] },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  mark: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  markText: { fontSize: 14, lineHeight: 18, fontWeight: "700" },
  message: { flex: 1 },
  action: { minHeight: 32, justifyContent: "center" },
});
