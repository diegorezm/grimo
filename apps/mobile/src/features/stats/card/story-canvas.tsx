import * as Sharing from "expo-sharing";
import type { ComponentRef, ReactNode, Ref } from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";
import { captureRef } from "react-native-view-shot";
import { storyCard } from "@/constants/theme";

export type CanvasRef = ComponentRef<typeof View>;

/**
 * Lays a card out at full Stories size (1080×1920, so templates use the same numbers as the
 * web) and shows it scaled down. Capturing the outer view at 1080 px keeps the PNG sharp: at
 * screen width a 3× iPhone already draws ~1080 real pixels.
 */
export function StoryCanvas({
  scale,
  style,
  ref,
  children,
}: {
  scale: number;
  style?: StyleProp<ViewStyle>;
  ref?: Ref<CanvasRef>;
  children: ReactNode;
}) {
  return (
    <View
      ref={ref}
      collapsable={false}
      style={[
        { width: storyCard.width * scale, height: storyCard.height * scale, overflow: "hidden" },
        style,
      ]}
    >
      <View
        style={{
          width: storyCard.width,
          height: storyCard.height,
          transform: [{ scale }],
          transformOrigin: "left top",
        }}
      >
        {children}
      </View>
    </View>
  );
}

/** PNG of the canvas at 1080×1920, handed to the share sheet (Stories, WhatsApp, Salvar…). */
export async function shareCard(canvas: CanvasRef, title: string) {
  const uri = await captureRef(canvas, {
    format: "png",
    width: storyCard.width,
    height: storyCard.height,
  });
  await Sharing.shareAsync(uri, { mimeType: "image/png", UTI: "public.png", dialogTitle: title });
}
