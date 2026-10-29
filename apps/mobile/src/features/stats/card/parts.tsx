import type { CardBook } from "@grimo/core";
import type { CardPalette } from "@grimo/tokens";
import { Image } from "expo-image";
import type { ReactNode } from "react";
import { Text as RNText, type StyleProp, type TextStyle, View, type ViewStyle } from "react-native";
import Svg, { Line, Path } from "react-native-svg";
import { Fonts } from "@/constants/theme";

// Cards use their own fixed palettes (the exported image looks the same for everyone), so the
// text here takes explicit colors instead of theme tokens.

type Face = "sans" | "heavy" | "serif" | "italic" | "mono" | "monoBold";
const FACES: Record<Face, string> = {
  sans: Fonts.sans,
  heavy: Fonts.sansHeavy,
  serif: Fonts.serif,
  italic: Fonts.serifItalic,
  mono: Fonts.mono,
  monoBold: Fonts.monoBold,
};

/** Text on a card: a face, a size and a color in 1080-wide card pixels. */
export function T({
  face = "sans",
  size,
  color,
  style,
  lines,
  children,
}: {
  face?: Face;
  size: number;
  color: string;
  style?: StyleProp<TextStyle>;
  lines?: number;
  children: ReactNode;
}) {
  return (
    <RNText
      allowFontScaling={false}
      numberOfLines={lines}
      style={[{ fontFamily: FACES[face], fontSize: size, color }, style]}
    >
      {children}
    </RNText>
  );
}

/** Four-point sparkle at any size and color. */
export function CardSparkle({
  size,
  color,
  style,
}: {
  size: number;
  color: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ position: "absolute" }, style]} pointerEvents="none">
      <Svg viewBox="0 0 24 24" width={size} height={size}>
        <Path
          d="M12 0C13 8 16 11 24 12C16 13 13 16 12 24C11 16 8 13 0 12C8 11 11 8 12 0Z"
          fill={color}
        />
      </Svg>
    </View>
  );
}

/** "▲ 20% vs set." — or nothing without a baseline. */
export function Delta({
  value,
  against,
  palette,
}: {
  value: number | null;
  against: string;
  palette: CardPalette;
}) {
  if (value === null) return null;
  const up = value >= 0;
  return (
    <T face="mono" size={30} color={palette.muted} style={{ marginTop: 12 }}>
      <RNText style={{ color: up ? palette.accent2 : palette.accent }}>
        {up ? "▲" : "▼"} {Math.abs(value)}%
      </RNText>{" "}
      vs {against}
    </T>
  );
}

/** Book cover, or its title on paper when there is no cover. */
export function CardCover({
  book,
  width,
  palette,
  style,
}: {
  book: CardBook;
  width: number;
  palette: CardPalette;
  style?: StyleProp<ViewStyle>;
}) {
  const box: ViewStyle = {
    width,
    height: width * 1.5,
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 40px 80px rgba(0,0,0,0.35)",
    backgroundColor: palette.paper,
  };
  return (
    <View style={[box, style]}>
      {book.coverUrl ? (
        <Image source={{ uri: book.coverUrl }} style={{ flex: 1 }} contentFit="cover" />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40 }}>
          <T face="italic" size={width / 7} color={palette.ink} style={{ textAlign: "center" }}>
            {book.title}
          </T>
        </View>
      )}
    </View>
  );
}

/** "✦ grimo · @rafa" footer line. */
export function CardFooter({
  username,
  palette,
  style,
}: {
  username: string | null;
  palette: CardPalette;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
        style,
      ]}
    >
      <T face="italic" size={56} color={palette.ink}>
        ✦ grimo
      </T>
      {username && (
        <T face="mono" size={32} color={palette.muted} style={{ letterSpacing: 3.2 }}>
          @{username}
        </T>
      )}
    </View>
  );
}

/** A dashed or dotted line that fills its row (iOS can't dash a single border side). */
export function Rule({
  color,
  weight = 4,
  dash = [12, 8],
  style,
}: {
  color: string;
  weight?: number;
  dash?: number[];
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ height: weight, opacity: 0.6 }, style]}>
      <Svg width="100%" height={weight}>
        <Line
          x1="0"
          y1={weight / 2}
          x2="100%"
          y2={weight / 2}
          stroke={color}
          strokeWidth={weight}
          strokeDasharray={dash}
        />
      </Svg>
    </View>
  );
}
