import { useCardData, useCardStudioStore } from "@grimo/client";
import { toMonthKey } from "@grimo/core";
import { type CardPaletteKey, cardPalettes } from "@grimo/tokens";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Button } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { StoryCanvas } from "../card/story-canvas";
import { CARD_COMPONENTS } from "../card/templates";

/** Small preview of this month's card (last style picked in the studio); opens the studio. */
export function MonthlyCard() {
  const studio = useCardStudioStore();
  const data = useCardData({ kind: "month", month: toMonthKey(new Date()) });
  if (!data) return null;
  const Card = CARD_COMPONENTS[studio.template];
  const palette = cardPalettes[studio.palette as CardPaletteKey] ?? cardPalettes.brasa;

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Personalizar o card do mês"
        onPress={() => router.push("/card")}
      >
        <StoryCanvas scale={0.25} style={styles.preview}>
          <Card
            data={data}
            palette={palette}
            showCover={studio.showCover}
            showDeltas={studio.showDeltas}
          />
        </StoryCanvas>
      </Pressable>
      <Button title="Personalizar e compartilhar" onPress={() => router.push("/card")} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: "center", gap: spacing[3] },
  preview: { borderRadius: radius.md },
});
