import { useUnreadNotifications } from "@grimo/client";
import { unreadBadge } from "@grimo/core";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon, Text } from "@/components/ui";
import { radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** Bell with the unread count; opens the notifications. */
export function NotificationBell() {
  const theme = useTheme();
  const unread = useUnreadNotifications().data ?? 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={unread > 0 ? `Notificações, ${unread} novas` : "Notificações"}
      hitSlop={8}
      onPress={() => router.push("/notifications")}
      style={({ pressed }) => [
        styles.root,
        { borderColor: theme.edge, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <SymbolView
        name="bell"
        tintColor={theme.text}
        size={20}
        fallback={<Icon name="bell" size={20} />}
      />
      {unread > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.accent }]}>
          <Text variant="label" color="accentForeground" style={styles.badgeText}>
            {unreadBadge(unread)}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: -2,
    minWidth: 18,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: radius.full,
    alignItems: "center",
  },
  badgeText: { fontSize: 10, letterSpacing: 0 },
});
