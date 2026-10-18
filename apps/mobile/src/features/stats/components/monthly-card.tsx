import { useMonthlySummary } from "@grimo/client";
import { GENRE_LABELS, type Genre } from "@grimo/core";
import * as Sharing from "expo-sharing";
import { type ComponentRef, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { captureRef } from "react-native-view-shot";
import { Button, Text } from "@/components/ui";
import { radius, spacing, storyCard } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const PREVIEW_WIDTH = 270;

/**
 * "Resumo do mês" card in Stories ratio (9:16). Captured as PNG at 1080×1920
 * and handed to the native share sheet (Instagram Stories, WhatsApp, save…).
 */
export function MonthlyCard({ month }: { month?: string }) {
  const theme = useTheme();
  const ref = useRef<ComponentRef<typeof View>>(null);
  const { data } = useMonthlySummary(month);
  if (!data) return null;

  async function share() {
    const uri = await captureRef(ref, {
      format: "png",
      width: storyCard.width,
      height: storyCard.height,
    });
    await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Meu mês de leitura" });
  }

  const genre = data.topGenre ? (GENRE_LABELS[data.topGenre as Genre] ?? data.topGenre) : "—";
  const fg = "primaryForeground" as const;

  return (
    <View style={styles.root}>
      <View ref={ref} collapsable={false} style={[styles.card, { backgroundColor: theme.primary }]}>
        <View>
          <Text variant="small" color={fg}>
            Meu mês de leitura
          </Text>
          <Text variant="display" color={fg}>
            {data.month}
          </Text>
        </View>
        <View style={styles.grid}>
          <Big value={data.booksRead} label="livros" />
          <Big value={data.pagesRead} label="páginas" />
          <Big value={genre} label="gênero mais lido" />
          {data.goal && <Big value={`${data.goal.percent}%`} label="da meta anual" />}
        </View>
        {data.favoriteBook && (
          <View>
            <Text variant="small" color={fg}>
              Livro favorito
            </Text>
            <Text variant="title" color={fg}>
              {data.favoriteBook.title}
            </Text>
          </View>
        )}
        <Text variant="title" color={fg}>
          grimo
        </Text>
      </View>
      <Button title="Compartilhar card" onPress={share} />
    </View>
  );
}

function Big({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={styles.cell}>
      <Text variant="heading" color="primaryForeground" numberOfLines={1}>
        {value}
      </Text>
      <Text variant="small" color="primaryForeground">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: "center", gap: spacing[3] },
  card: {
    width: PREVIEW_WIDTH,
    aspectRatio: storyCard.width / storyCard.height,
    borderRadius: radius.lg,
    padding: spacing[6],
    justifyContent: "space-between",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: spacing[4] },
  cell: { width: "50%" },
});
