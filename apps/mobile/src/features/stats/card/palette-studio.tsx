import { useCardStudioStore } from "@grimo/client";
import { type CardPalette, type CardPaletteKey, cardPalettes } from "@grimo/tokens";
import { router } from "expo-router";
import { type ReactNode, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { Button, Screen, Text } from "@/components/ui";
import { radius, spacing, storyCard } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { type CanvasRef, StoryCanvas, shareCard } from "./story-canvas";

/**
 * A one-template Stories card (group, finished book, quote): the preview, share, and the colors
 * (shared with the monthly card). `children` is null while the data loads.
 */
export function PaletteStudio({
  title,
  note,
  shareTitle,
  children,
}: {
  title: string;
  note?: string;
  shareTitle: string;
  children: ((palette: CardPalette) => ReactNode) | null;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const studio = useCardStudioStore();
  const canvas = useRef<CanvasRef>(null);
  const [busy, setBusy] = useState(false);
  const palette = cardPalettes[studio.palette as CardPaletteKey] ?? cardPalettes.brasa;
  // Full width (≈1080 real pixels on a 3× iPhone), so the shared image stays sharp.
  const scale = Math.min(width - spacing[4] * 2, 420) / storyCard.width;

  async function share() {
    if (!canvas.current) return;
    setBusy(true);
    try {
      await shareCard(canvas.current, shareTitle);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={styles.bar}>
        <Button variant="ghost" title="‹ Voltar" onPress={() => router.back()} />
      </View>
      <View>
        <Text variant="display">{title}</Text>
        {note && <Text color="textMuted">{note}</Text>}
      </View>

      <View style={styles.center}>
        {children ? (
          <StoryCanvas ref={canvas} scale={scale} style={styles.preview}>
            {children(palette)}
          </StoryCanvas>
        ) : (
          <View
            style={{ width: storyCard.width * scale, height: storyCard.height * scale }}
            accessibilityLabel="Carregando o card"
          >
            <ActivityIndicator color={theme.accent} style={styles.flex} />
          </View>
        )}
      </View>
      <Button
        title={busy ? "Preparando…" : "Compartilhar"}
        disabled={busy || !children}
        onPress={share}
      />

      <Text variant="label" color="textMuted">
        Cores
      </Text>
      <View style={styles.wrap}>
        {Object.entries(cardPalettes).map(([key, option]) => {
          const active = key === studio.palette;
          return (
            <Pressable
              key={key}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => studio.set({ palette: key })}
              style={[
                styles.chip,
                { borderColor: active ? theme.accent : theme.border },
                active && { backgroundColor: theme.surfaceMuted },
              ]}
            >
              {/* Swatch: fixed card colors, not tokens. */}
              <View style={[styles.swatch, { backgroundColor: option.bg }]}>
                <View style={[styles.swatchHalf, { backgroundColor: option.accent }]} />
              </View>
              <Text variant="small">{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row" },
  flex: { flex: 1 },
  center: { alignItems: "center" },
  preview: { borderRadius: radius.lg },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    borderWidth: 1,
    borderRadius: radius.full,
    paddingVertical: spacing[2],
    paddingLeft: 6,
    paddingRight: spacing[3],
  },
  swatch: { width: 28, height: 28, borderRadius: 14, overflow: "hidden" },
  swatchHalf: { position: "absolute", right: 0, top: 0, bottom: 0, width: 14 },
});
