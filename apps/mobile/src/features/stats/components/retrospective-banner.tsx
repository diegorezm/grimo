import { useYearlySummary } from "@grimo/client";
import { retrospectiveYear } from "@grimo/core";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Card, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";

/** In December (and January, for the year that ended): "your year in books is ready". */
export function RetrospectiveBanner() {
  const year = retrospectiveYear(new Date());
  const { data } = useYearlySummary(year ?? undefined, { enabled: year !== null });
  if (year === null || !data || data.booksRead === 0) return null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: "/card", params: { year: String(year) } })}
    >
      <Card>
        <View style={styles.text}>
          <Text variant="label" color="textMuted">
            ✦ Retrospectiva {year}
          </Text>
          <Text variant="title">
            {data.booksRead} {data.booksRead === 1 ? "livro" : "livros"} e{" "}
            {data.pagesRead.toLocaleString("pt-BR")} páginas. Monte seu card do ano.
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({ text: { gap: spacing[1] } });
