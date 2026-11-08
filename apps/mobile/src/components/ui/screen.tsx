import type { ReactNode } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/**
 * Base screen: safe area + themed background + optional scroll. `centered` puts short content
 * (sign in, forms) in the middle of the screen; it still scrolls when the keyboard needs room.
 */
export function Screen({
  children,
  scroll = true,
  centered = false,
}: {
  children: ReactNode;
  scroll?: boolean;
  centered?: boolean;
}) {
  const theme = useTheme();
  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.background }]}
      edges={centered ? ["top", "bottom"] : ["top"]}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, centered && styles.centered]}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    gap: spacing[6],
    paddingBottom: 120,
  },
  centered: { flexGrow: 1, justifyContent: "center", paddingBottom: spacing[4] },
});
