import { useCardData, useCardStudioStore } from "@grimo/client";
import {
  CARD_TEMPLATE_LABELS,
  CARD_TEMPLATES,
  type CardPeriod,
  shiftMonth,
  toMonthKey,
} from "@grimo/core";
import { type CardPaletteKey, cardPalettes } from "@grimo/tokens";
import { router } from "expo-router";
import { type ReactNode, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  useWindowDimensions,
  View,
} from "react-native";
import { Button, Screen, Text } from "@/components/ui";
import { radius, spacing, storyCard } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { type CanvasRef, StoryCanvas, shareCard } from "./story-canvas";
import { CARD_COMPONENTS } from "./templates";

const THIS_MONTH = toMonthKey(new Date());
const THIS_YEAR = Number(THIS_MONTH.slice(0, 4));
/** The year so far, the last six months, and last year's retrospectiva. */
const PERIODS: CardPeriod[] = [
  { kind: "year", year: THIS_YEAR },
  ...Array.from({ length: 6 }, (_, i) => ({
    kind: "month" as const,
    month: shiftMonth(THIS_MONTH, -i),
  })),
  { kind: "year", year: THIS_YEAR - 1 },
];
const periodKey = (period: CardPeriod) =>
  period.kind === "month" ? period.month : String(period.year);
const monthChip = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});

/** Pick a layout, colors, period and details; preview live; share the PNG. */
export function CardStudio({ year }: { year?: number }) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const studio = useCardStudioStore();
  const [period, setPeriod] = useState<CardPeriod>(
    year ? { kind: "year", year } : { kind: "month", month: THIS_MONTH },
  );
  const data = useCardData(period);
  const canvas = useRef<CanvasRef>(null);
  const [busy, setBusy] = useState(false);

  const palette = cardPalettes[studio.palette as CardPaletteKey] ?? cardPalettes.brasa;
  const Card = CARD_COMPONENTS[studio.template];
  // Full width (≈1080 real pixels on a 3× iPhone), so the shared image stays sharp.
  const scale = Math.min(width - spacing[4] * 2, 420) / storyCard.width;
  const title = period.kind === "year" ? `Retrospectiva ${period.year}` : "Card do mês";

  async function share() {
    if (!canvas.current) return;
    setBusy(true);
    try {
      await shareCard(canvas.current, title);
    } finally {
      setBusy(false);
    }
  }

  const cardProps = data && {
    data,
    palette,
    showCover: studio.showCover,
    showDeltas: studio.showDeltas,
  };

  return (
    <Screen>
      <View style={styles.bar}>
        <Button variant="ghost" title="‹ Voltar" onPress={() => router.back()} />
      </View>
      <View>
        <Text variant="display">{title}</Text>
        <Text color="textMuted">Escolha um modelo e as cores, e compartilhe nos Stories.</Text>
      </View>

      <View style={styles.center}>
        {cardProps ? (
          <StoryCanvas ref={canvas} scale={scale} style={styles.preview}>
            <Card {...cardProps} />
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
        disabled={busy || !cardProps}
        onPress={share}
      />

      <Section title="Modelo">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {CARD_TEMPLATES.map((template) => {
            const Thumb = CARD_COMPONENTS[template];
            const active = template === studio.template;
            return (
              <Pressable
                key={template}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={CARD_TEMPLATE_LABELS[template].label}
                onPress={() => studio.set({ template })}
                style={[
                  styles.template,
                  { borderColor: active ? theme.accent : theme.border },
                  active && { backgroundColor: theme.surfaceMuted },
                ]}
              >
                {cardProps && (
                  <StoryCanvas scale={0.1} style={styles.thumb}>
                    <Thumb {...cardProps} />
                  </StoryCanvas>
                )}
                <Text variant="title">{CARD_TEMPLATE_LABELS[template].label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Section>

      <Section title="Cores">
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
                  styles.swatchChip,
                  { borderColor: active ? theme.accent : theme.border },
                  active && { backgroundColor: theme.surfaceMuted },
                ]}
              >
                {/* Swatch: background with the two accents. Fixed card colors, not tokens. */}
                <View style={[styles.swatch, { backgroundColor: option.bg }]}>
                  <View style={[styles.swatchCorner, { backgroundColor: option.accent }]} />
                  <View style={[styles.swatchDot, { backgroundColor: option.accent2 }]} />
                </View>
                <Text variant="small">{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section title="Período">
        <View style={styles.wrap}>
          {PERIODS.map((option) => {
            const key = periodKey(option);
            const active = key === periodKey(period);
            return (
              <Pressable
                key={key}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                onPress={() => setPeriod(option)}
                style={[
                  styles.chip,
                  { borderColor: active ? theme.primary : theme.border },
                  active && { backgroundColor: theme.primary },
                ]}
              >
                <Text variant="label" color={active ? "primaryForeground" : "textMuted"}>
                  {option.kind === "year"
                    ? `Ano ${option.year}`
                    : monthChip.format(new Date(`${option.month}-15T12:00:00Z`))}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section title="Detalhes">
        <Toggle
          label="Mostrar a capa do favorito"
          value={studio.showCover}
          onChange={(showCover) => studio.set({ showCover })}
        />
        <Toggle
          label={`Comparar com o ${period.kind === "year" ? "ano" : "mês"} anterior`}
          value={studio.showDeltas}
          onChange={(showDeltas) => studio.set({ showDeltas })}
        />
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="label" color="textMuted">
        {title}
      </Text>
      {children}
    </View>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.toggle}>
      <Text style={styles.flex}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: theme.accent }}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row" },
  flex: { flex: 1 },
  center: { alignItems: "center" },
  preview: { borderRadius: radius.lg },
  section: { gap: spacing[3] },
  row: { gap: spacing[3] },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  template: {
    alignItems: "center",
    gap: spacing[2],
    padding: spacing[2],
    borderWidth: 1,
    borderRadius: radius.md,
  },
  thumb: { borderRadius: radius.sm },
  chip: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  swatchChip: { flexDirection: "row", alignItems: "center", gap: spacing[2], paddingLeft: 6 },
  swatch: { width: 28, height: 28, borderRadius: 14, overflow: "hidden" },
  swatchCorner: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderTopLeftRadius: 14,
  },
  swatchDot: { position: "absolute", top: 4, left: 4, width: 9, height: 9, borderRadius: 5 },
  toggle: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
});
