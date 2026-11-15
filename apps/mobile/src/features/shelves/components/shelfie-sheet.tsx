import { type ShelfItem, toast, useMe } from "@grimo/client";
import type { DecorLevels, ShelfStyle } from "@grimo/core";
import * as Sharing from "expo-sharing";
import { type ComponentRef, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import { Text } from "@/components/ui";
import { Fonts, radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Bookcase } from "../bookcase/bookcase";
import { materialOf } from "../bookcase/look";

/** The picture is laid out at this width and exported three times as large. */
const WIDTH = 360;
const EXPORT_WIDTH = 1080;
const FOOT = 64;

const FORMATS = [
  { id: "9:16", height: 640, hint: "Stories, Reels e TikTok" },
  { id: "4:5", height: 450, hint: "Post no feed" },
  { id: "1:1", height: 360, hint: "Quadrado, para qualquer lugar" },
] as const;

/**
 * "Shelfie": the shelf as a picture to post, with your @ and the books read this year, in the
 * three sizes people post in. The picture is the same bookcase, dressed the same way.
 */
export function ShelfieSheet({
  shelf,
  decorLevels,
  readThisYear,
  onClose,
}: {
  /** The shelf to share; null: closed. */
  shelf: { name: string; items: ShelfItem[]; style: ShelfStyle; order: readonly string[] } | null;
  decorLevels?: DecorLevels;
  readThisYear: number;
  onClose: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const me = useMe().data;
  const canvas = useRef<ComponentRef<typeof View>>(null);
  const [format, setFormat] = useState<(typeof FORMATS)[number]>(FORMATS[0]);
  const [sharing, setSharing] = useState(false);

  if (!shelf) return null;
  const material = materialOf(shelf.style);
  const scale = Math.min(
    (window.width - spacing[5] * 2) / WIDTH,
    (window.height - insets.top - insets.bottom - 300) / format.height,
  );
  const year = new Date().getFullYear();

  async function share() {
    if (!canvas.current || sharing) return;
    setSharing(true);
    try {
      const uri = await captureRef(canvas.current, {
        format: "png",
        width: EXPORT_WIDTH,
        height: Math.round((EXPORT_WIDTH * format.height) / WIDTH),
      });
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        UTI: "public.png",
        dialogTitle: `Estante ${shelf?.name ?? ""}`,
      });
    } catch (error) {
      toast.failed(error);
    } finally {
      setSharing(false);
    }
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View
        style={[
          styles.root,
          {
            backgroundColor: theme.background,
            paddingTop: insets.top + spacing[3],
            paddingBottom: insets.bottom + spacing[4],
          },
        ]}
      >
        <View style={styles.head}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            onPress={onClose}
            hitSlop={8}
            style={[styles.close, { borderColor: theme.border }]}
          >
            <Text variant="label">✕</Text>
          </Pressable>
          <Text variant="heading" style={styles.title}>
            Compartilhar estante
          </Text>
          <View style={styles.close} />
        </View>

        <View style={styles.stage}>
          <View style={[styles.card, { boxShadow: `0 18px 36px ${theme.shadow}` }]}>
            <View
              ref={canvas}
              collapsable={false}
              pointerEvents="none"
              style={{ width: WIDTH * scale, height: format.height * scale, overflow: "hidden" }}
            >
              <View
                style={{
                  width: WIDTH,
                  height: format.height,
                  backgroundColor: material.room,
                  transform: [{ scale }],
                  transformOrigin: "left top",
                }}
              >
                <View style={{ height: format.height - FOOT, overflow: "hidden" }}>
                  <Bookcase
                    items={shelf.items}
                    style={shelf.style}
                    order={shelf.order}
                    decorLevels={decorLevels}
                    width={WIDTH}
                    minHeight={format.height - FOOT}
                    top={20}
                    bottom={0}
                    name={shelf.name}
                    onPress={() => {}}
                  />
                </View>
                <View style={[styles.foot, { backgroundColor: material.side }]}>
                  <View>
                    <Text style={[styles.handle, { color: material.ink }]} numberOfLines={1}>
                      {me?.username ? `@${me.username}` : shelf.name}
                    </Text>
                    <Text style={[styles.count, { color: material.ink }]}>
                      {readThisYear} {readThisYear === 1 ? "lido" : "lidos"} em {year}
                    </Text>
                  </View>
                  <Text style={[styles.brand, { color: material.ink }]}>grimo</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.controls}>
          <View
            accessibilityRole="radiogroup"
            style={[styles.formats, { borderColor: theme.border, backgroundColor: theme.surface }]}
          >
            {FORMATS.map((option) => {
              const active = option.id === format.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${option.id}. ${option.hint}`}
                  onPress={() => setFormat(option)}
                  style={[
                    styles.format,
                    active && {
                      backgroundImage: `linear-gradient(135deg, ${theme.accentStart} 0%, ${theme.accent} 100%)`,
                    },
                  ]}
                >
                  <Text variant="label" color={active ? "accentForeground" : "text"}>
                    {option.id}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text variant="small" color="textMuted">
            {format.hint}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: sharing }}
            onPress={share}
            style={({ pressed }) => [
              styles.share,
              {
                backgroundImage: `linear-gradient(135deg, ${theme.accentStart} 0%, ${theme.accent} 100%)`,
                opacity: pressed || sharing ? 0.85 : 1,
              },
            ]}
          >
            {sharing ? (
              <ActivityIndicator color={theme.accentForeground} />
            ) : (
              <Text variant="label" color="accentForeground">
                Compartilhar
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing[5], gap: spacing[4] },
  head: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
  },
  title: { flex: 1, textAlign: "center" },
  stage: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: { overflow: "hidden", borderRadius: 10 },
  foot: {
    height: FOOT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
  },
  handle: { fontFamily: Fonts.serif, fontSize: 17 },
  count: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  brand: { fontFamily: Fonts.serifBold, fontSize: 20 },
  controls: { alignItems: "center", gap: spacing[3] },
  formats: {
    flexDirection: "row",
    gap: 2,
    padding: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  format: {
    minWidth: 76,
    minHeight: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  share: {
    alignSelf: "stretch",
    minHeight: 54,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
