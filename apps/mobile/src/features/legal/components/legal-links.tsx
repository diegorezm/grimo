import { LEGAL_PATHS } from "@grimo/core";
import * as WebBrowser from "expo-web-browser";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { SITE_URL } from "@/lib/server";

/** Where the app records an acceptance (stored as evidence). */
export const legalSource = Platform.OS === "ios" ? "ios" : "android";

/** Opens a legal page of the web app in the in-app browser. */
export const openLegal = (page: keyof typeof LEGAL_PATHS, hash = "") =>
  WebBrowser.openBrowserAsync(`${SITE_URL}${LEGAL_PATHS[page]}${hash}`);

/** Terms, Privacy, cookies and "how to delete" links (settings). */
export function LegalLinks() {
  const links = [
    { label: "Termos de uso", open: () => openLegal("terms") },
    { label: "Política de privacidade", open: () => openLegal("privacy") },
  ];
  return (
    <View style={styles.row}>
      {links.map((link) => (
        <Pressable key={link.label} accessibilityRole="link" onPress={link.open} hitSlop={6}>
          <Text variant="label" color="accent">
            {link.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing[4] },
});
