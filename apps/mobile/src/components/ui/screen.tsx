import type { ReactNode } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useFirstVisit } from "@/lib/motion";
import { EnterEach } from "./enter";

/**
 * Base screen: safe area + themed background + optional scroll. `centered` puts short content
 * (sign in, forms) in the middle of the screen; it still scrolls when the keyboard needs room.
 * `enter`: a key for the screen; the first time it opens, its blocks rise in one after the other.
 */
export function Screen({
  children,
  scroll = true,
  centered = false,
  enter,
}: {
  children: ReactNode;
  scroll?: boolean;
  centered?: boolean;
  enter?: string;
}) {
  const theme = useTheme();
  const animate = useFirstVisit(enter ?? null);
  const content = <EnterEach animate={animate}>{children}</EnterEach>;
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
          {content}
        </ScrollView>
      ) : (
        content
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
