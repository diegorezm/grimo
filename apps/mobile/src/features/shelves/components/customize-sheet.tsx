import {
  applyShelfChoice,
  type DecorProgress,
  presetOf,
  SHELF_COMBINATIONS,
  SHELF_DECOR,
  SHELF_DECOR_LABELS,
  SHELF_LAYOUT_LABELS,
  SHELF_LAYOUTS,
  SHELF_LIGHT_LABELS,
  SHELF_LIGHTS,
  SHELF_MATERIAL_LABELS,
  SHELF_MATERIALS,
  SHELF_MODEL_LABELS,
  SHELF_MODELS,
  SHELF_PRESETS,
  SHELF_SORT_LABELS,
  SHELF_SORTS,
  type ShelfDecor,
  type ShelfStyle,
  SPINE_FINISH_LABELS,
  SPINE_FINISHES,
  spineSize,
  toggleDecor,
} from "@grimo/core";
import { type ReactNode, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Glass, Text } from "@/components/ui";
import { radius, shelfBrass, shelfMaterials, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Spine } from "../bookcase/bookcase";
import { DecorPiece } from "../bookcase/decor";
import { materialOf, spinePaint } from "../bookcase/look";
import { BookcaseThumb } from "../bookcase/thumb";

const TABS = ["Prontos", "Modelo", "Cores", "Lombadas", "Arrumar", "Enfeites", "Luz"] as const;
type Tab = (typeof TABS)[number];

/** How the sheet moves: one smooth ease, no bounce. */
const MOTION = { duration: 280, easing: Easing.out(Easing.cubic) };

/**
 * The sheet's two heights: under half the screen (most of the bookcase stays in view) and tall, for
 * picking with room. The bookcase keeps its size and scrolls above the sheet.
 */
export function useCustomizeSheetHeights() {
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return {
    compact: Math.max(340, Math.round(window.height * 0.42)),
    tall: Math.round(window.height - insets.top - 56),
  };
}

/**
 * "Do seu jeito": every layer of the shelf, changed live on the bookcase above (it shrinks to
 * fit). Ready styles first; then model, colors, spines, arrangement, objects and light.
 */
export function CustomizeSheet({
  style,
  titles,
  decor,
  onChange,
  onDone,
}: {
  style: ShelfStyle;
  /** Titles of the shelf's books, for the drawings. */
  titles: readonly string[];
  /** What each object earns with your reading, and how far it is. */
  decor?: Record<ShelfDecor, DecorProgress>;
  onChange: (style: ShelfStyle) => void;
  onDone: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("Prontos");
  const heights = useCustomizeSheetHeights();
  const [tall, setTall] = useState(false);

  // In from below once, then up and down between the two heights by the handle.
  const height = useSharedValue(heights.compact);
  const offset = useSharedValue(heights.compact);
  useEffect(() => {
    offset.value = withTiming(0, MOTION);
  }, [offset]);
  useEffect(() => {
    height.value = withTiming(tall ? heights.tall : heights.compact, MOTION);
  }, [tall, heights.tall, heights.compact, height]);
  const dock = useAnimatedStyle(() => ({
    height: height.value,
    transform: [{ translateY: offset.value }],
  }));

  const drag = Gesture.Pan()
    .onChange((event) => {
      height.value = Math.min(
        heights.tall,
        Math.max(heights.compact - 80, height.value - event.changeY),
      );
    })
    .onEnd((event) => {
      const middle = (heights.compact + heights.tall) / 2;
      const up = event.velocityY < -400 || (event.velocityY < 400 && height.value > middle);
      height.value = withTiming(up ? heights.tall : heights.compact, MOTION);
      runOnJS(setTall)(up);
    });
  const set = (patch: Partial<ShelfStyle>) => onChange(applyShelfChoice(style, patch));
  const lights = {
    day: `linear-gradient(180deg, ${theme.surface} 0%, ${theme.surfaceMuted} 100%)`,
    sunset: `linear-gradient(200deg, ${shelfBrass.light} 0%, ${theme.glowA} 70%)`,
    lamp: `radial-gradient(ellipse at 50% 0%, ${shelfBrass.light} 0%, ${shelfBrass.ink} 75%)`,
  };
  const current = presetOf(style);

  return (
    <Animated.View style={[styles.dock, dock]}>
      <Glass style={[styles.sheet, { paddingBottom: insets.bottom + spacing[3] }]}>
        <GestureDetector gesture={drag}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tall ? "Diminuir o painel" : "Aumentar o painel"}
            onPress={() => setTall(!tall)}
            style={styles.handle}
          >
            <View style={[styles.grabber, { backgroundColor: theme.border }]} />
            <View style={styles.head}>
              <View style={styles.heading}>
                <Text variant="heading">Do seu jeito</Text>
                <Text variant="label" color="textMuted" numberOfLines={1}>
                  {current
                    ? current.name
                    : `${SHELF_COMBINATIONS.toLocaleString("pt-BR")} combinações`}
                </Text>
              </View>
              {/* Small, beside the title: the room below stays for the options. */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Pronto, ficou a minha cara"
                onPress={onDone}
                hitSlop={{ top: 4, bottom: 4 }}
                style={({ pressed }) => [
                  styles.done,
                  {
                    backgroundImage: `linear-gradient(135deg, ${theme.accentStart} 0%, ${theme.accent} 100%)`,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text variant="label" color="accentForeground">
                  ✓ Pronto
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </GestureDetector>
        <ScrollView
          horizontal
          style={styles.tabRow}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {TABS.map((name) => {
            const active = tab === name;
            return (
              <Pressable
                key={name}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setTab(name)}
                hitSlop={{ top: 5, bottom: 5 }}
                style={[
                  styles.tab,
                  {
                    borderColor: active ? theme.accent : theme.border,
                    backgroundColor: active ? theme.surface : "transparent",
                  },
                ]}
              >
                <Text variant="label" color={active ? "text" : "textMuted"}>
                  {name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          <Animated.View key={tab} entering={FadeIn.duration(180)} style={styles.grid}>
            {tab === "Prontos" &&
              SHELF_PRESETS.map((preset) => (
                <Option
                  key={preset.id}
                  half
                  active={current?.id === preset.id}
                  title={preset.name}
                  hint={preset.hint}
                  onPress={() => onChange(preset.style)}
                >
                  <BookcaseThumb style={preset.style} titles={titles} />
                </Option>
              ))}
            {tab === "Modelo" &&
              SHELF_MODELS.map((model) => (
                <Option
                  key={model}
                  half
                  active={style.model === model}
                  title={SHELF_MODEL_LABELS[model].name}
                  hint={SHELF_MODEL_LABELS[model].hint}
                  onPress={() => set({ model })}
                >
                  <BookcaseThumb style={{ ...style, model }} titles={titles} />
                </Option>
              ))}
            {tab === "Cores" &&
              SHELF_MATERIALS.map((material) => {
                const m = shelfMaterials[material];
                return (
                  <Option
                    key={material}
                    half
                    active={style.material === material}
                    title={SHELF_MATERIAL_LABELS[material].name}
                    hint={SHELF_MATERIAL_LABELS[material].hint}
                    onPress={() => set({ material })}
                  >
                    <View style={styles.swatch}>
                      <View style={[styles.grow, { backgroundColor: m.room }]} />
                      <View style={styles.grow}>
                        <View style={[styles.grow, { backgroundColor: m.side }]} />
                        <View style={[styles.grow, { backgroundColor: m.back }]} />
                        <View style={{ height: 12, backgroundColor: m.plank }} />
                      </View>
                    </View>
                  </Option>
                );
              })}
            {tab === "Lombadas" &&
              SPINE_FINISHES.map((finish) => (
                <Option
                  key={finish}
                  half
                  boxed
                  active={style.finish === finish}
                  title={SPINE_FINISH_LABELS[finish].name}
                  hint={SPINE_FINISH_LABELS[finish].hint}
                  onPress={() => set({ finish })}
                >
                  <View style={styles.spines}>
                    {(titles.length > 0 ? titles : ["A", "B", "C", "D", "E", "F"])
                      .slice(0, 6)
                      .map((title, i) => {
                        const size = spineSize(title, null);
                        return (
                          <Spine
                            key={`${title}-${i}`}
                            title=""
                            width={Math.round(size.width * 0.55)}
                            height={Math.round(size.height * 0.42)}
                            paint={spinePaint(materialOf(style), size.tone, finish)}
                            finish={finish}
                          />
                        );
                      })}
                  </View>
                </Option>
              ))}
            {tab === "Arrumar" && (
              <>
                <Section label="Como ficam" />
                {SHELF_LAYOUTS.map((layout) => (
                  <Option
                    key={layout}
                    half
                    boxed
                    active={style.layout === layout}
                    title={SHELF_LAYOUT_LABELS[layout]}
                    onPress={() => set({ layout })}
                  >
                    <LayoutDrawing layout={layout} />
                  </Option>
                ))}
                <Section label="Em que ordem" />
                {SHELF_SORTS.map((sort) => (
                  <Option
                    key={sort}
                    half
                    boxed
                    active={style.sort === sort}
                    title={SHELF_SORT_LABELS[sort]}
                    hint={
                      sort === "manual"
                        ? "Segure e arraste"
                        : sort === "rainbow"
                          ? "Pela cor das capas"
                          : undefined
                    }
                    onPress={() => set({ sort })}
                  />
                ))}
              </>
            )}
            {tab === "Enfeites" &&
              SHELF_DECOR.map((item) => {
                const on = style.decor.includes(item);
                const progress = decor?.[item];
                const earned = (progress?.level ?? 0) > 0;
                return (
                  <Option
                    key={item}
                    half
                    boxed
                    active={on}
                    checkbox
                    title={SHELF_DECOR_LABELS[item]}
                    hint={
                      progress
                        ? earned
                          ? progress.earned
                          : `${progress.hint} · ${progress.done} de ${progress.target}`
                        : undefined
                    }
                    onPress={() => onChange(toggleDecor(style, item))}
                  >
                    <View style={[styles.object, { opacity: on ? 1 : 0.45 }]}>
                      <DecorPiece decor={item} still level={progress?.level ?? 0} />
                    </View>
                    {progress && (
                      <View style={[styles.track, { backgroundColor: theme.surfaceMuted }]}>
                        <View
                          style={{
                            width: `${Math.round((progress.done / progress.target) * 100)}%`,
                            height: 4,
                            borderRadius: 2,
                            backgroundImage: `linear-gradient(90deg, ${theme.accentStart} 0%, ${theme.accent} 100%)`,
                          }}
                        />
                      </View>
                    )}
                  </Option>
                );
              })}
            {tab === "Luz" &&
              SHELF_LIGHTS.map((light) => (
                <Option
                  key={light}
                  half
                  boxed
                  active={style.light === light}
                  title={SHELF_LIGHT_LABELS[light].name}
                  hint={SHELF_LIGHT_LABELS[light].hint}
                  onPress={() => set({ light })}
                >
                  <View style={[styles.light, { backgroundImage: lights[light] }]} />
                </Option>
              ))}
          </Animated.View>
        </ScrollView>
      </Glass>
    </Animated.View>
  );
}

function Section({ label }: { label: string }) {
  return (
    <View style={styles.section}>
      <Text variant="label" color="textMuted">
        {label}
      </Text>
    </View>
  );
}

/** One choice: a drawing (optional), its name and a hint. */
function Option({
  title,
  hint,
  active,
  half,
  boxed,
  checkbox,
  onPress,
  children,
}: {
  title: string;
  hint?: string;
  active: boolean;
  half?: boolean;
  /** On a card (spines, objects): the ring goes around the card. */
  boxed?: boolean;
  checkbox?: boolean;
  onPress: () => void;
  children?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole={checkbox ? "checkbox" : "radio"}
      accessibilityState={checkbox ? { checked: active } : { selected: active }}
      accessibilityLabel={hint ? `${title}. ${hint}` : title}
      onPress={onPress}
      style={({ pressed }) => [
        half ? styles.half : styles.full,
        boxed && [
          styles.boxed,
          {
            backgroundColor: theme.surface,
            borderColor: active ? theme.accent : theme.border,
            borderWidth: active ? 2 : 1,
          },
        ],
        { opacity: pressed ? 0.75 : 1 },
      ]}
    >
      {children && (
        <View
          style={
            !boxed && {
              borderRadius: 14,
              borderWidth: 2,
              borderColor: active ? theme.accent : "transparent",
              overflow: "hidden",
            }
          }
        >
          {children}
        </View>
      )}
      <Text style={styles.optionTitle}>{title}</Text>
      {hint && (
        <Text variant="small" color="textMuted">
          {hint}
        </Text>
      )}
    </Pressable>
  );
}

function LayoutDrawing({ layout }: { layout: (typeof SHELF_LAYOUTS)[number] }) {
  const theme = useTheme();
  const tones = [theme.accentStart, theme.accent, theme.gold, theme.success];
  const shapes =
    layout === "covers"
      ? [
          { w: 18, h: 27 },
          { w: 18, h: 27 },
          { w: 18, h: 27 },
        ]
      : layout === "mixed"
        ? [
            { w: 7, h: 34 },
            { w: 18, h: 27 },
            { w: 20, h: 8 },
            { w: 7, h: 32, lean: true },
          ]
        : layout === "stacks"
          ? [
              { w: 7, h: 34 },
              { w: 9, h: 30 },
              { w: 22, h: 8 },
              { w: 7, h: 32, lean: true },
            ]
          : [
              { w: 7, h: 34 },
              { w: 9, h: 30 },
              { w: 6, h: 36 },
              { w: 8, h: 32 },
              { w: 7, h: 28 },
            ];
  return (
    <View style={[styles.drawing, { borderBottomColor: theme.edge }]}>
      {shapes.map((shape, i) => (
        <View
          key={i}
          style={{
            width: shape.w,
            height: shape.h,
            borderRadius: 2,
            backgroundColor: tones[i % tones.length],
            transform: "lean" in shape ? [{ rotate: "-12deg" }] : undefined,
            transformOrigin: "left bottom",
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dock: { position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 20 },
  handle: { gap: spacing[3], paddingTop: spacing[2], paddingBottom: spacing[1] },
  sheet: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    gap: spacing[3],
  },
  grabber: { width: 40, height: 5, borderRadius: 3, alignSelf: "center" },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
    paddingHorizontal: spacing[5],
  },
  heading: { flex: 1, minWidth: 0, gap: 2 },
  tabs: { gap: spacing[2], paddingHorizontal: spacing[5] },
  tabRow: { flexGrow: 0, flexShrink: 0 },
  tab: {
    height: 34,
    justifyContent: "center",
    paddingHorizontal: spacing[4],
    borderRadius: radius.full,
    borderWidth: 1,
  },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: spacing[5], paddingBottom: spacing[3] },
  grid: { flexDirection: "row", flexWrap: "wrap", columnGap: spacing[3], rowGap: spacing[4] },
  half: { width: "47.5%", gap: 2 },
  full: { width: "100%", gap: 2 },
  boxed: { borderRadius: radius.md, padding: spacing[3], alignItems: "center" },
  optionTitle: { fontWeight: "700", fontSize: 16, marginTop: spacing[1] },
  section: { width: "100%" },
  swatch: { height: 88, flexDirection: "row" },
  grow: { flex: 1 },
  spines: { height: 66, flexDirection: "row", alignItems: "flex-end", gap: 2 },
  object: { height: 64, justifyContent: "flex-end", transform: [{ scale: 0.8 }] },
  track: { width: 96, height: 4, borderRadius: 2, marginTop: 6, overflow: "hidden" },
  light: { width: "100%", height: 72, borderRadius: 10 },
  drawing: {
    height: 44,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    borderBottomWidth: 3,
    paddingHorizontal: 4,
  },
  done: {
    height: 40,
    paddingHorizontal: spacing[4],
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
