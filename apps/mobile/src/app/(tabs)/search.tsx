import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Screen, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { BookSearch } from "@/features/books";
import { ReaderSearch } from "@/features/readers";
import { useTheme } from "@/hooks/use-theme";

type Mode = "books" | "readers";
const MODES: { mode: Mode; label: string }[] = [
  { mode: "books", label: "Livros" },
  { mode: "readers", label: "Leitores" },
];

export default function SearchScreen() {
  const theme = useTheme();
  const [mode, setMode] = useState<Mode>("books");
  return (
    <Screen enter="search">
      <Text variant="display">Buscar</Text>
      <View style={[styles.tabs, { borderColor: theme.edge }]} accessibilityRole="tablist">
        {MODES.map((item) => {
          const active = item.mode === mode;
          return (
            <Pressable
              key={item.mode}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setMode(item.mode)}
              style={[styles.tab, active && { borderColor: theme.text }]}
            >
              <Text variant="label" color={active ? "text" : "textMuted"}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {mode === "books" ? <BookSearch /> : <ReaderSearch />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", gap: spacing[5], borderBottomWidth: 1, marginBottom: -spacing[2] },
  tab: {
    paddingVertical: spacing[2],
    borderBottomWidth: 2,
    borderColor: "transparent",
    marginBottom: -1,
  },
});
