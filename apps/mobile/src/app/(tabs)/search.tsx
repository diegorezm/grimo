import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Glass, Screen, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
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
    <Screen>
      <Text variant="display">Buscar</Text>
      <Glass style={styles.switch}>
        {MODES.map((item) => {
          const active = item.mode === mode;
          return (
            <Pressable
              key={item.mode}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setMode(item.mode)}
              style={[styles.option, active && { backgroundColor: theme.surface }]}
            >
              <Text variant="label" color={active ? "text" : "textMuted"}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </Glass>
      {mode === "books" ? <BookSearch /> : <ReaderSearch />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  switch: { flexDirection: "row", padding: spacing[1], gap: spacing[1], borderRadius: radius.full },
  option: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing[2],
    borderRadius: radius.full,
  },
});
