import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { CardCover, CardFooter, CardSparkle, Delta, T } from "../parts";
import type { CardProps } from "../types";

/** Soft journal page: glows, sparkles, serif italics and the favorite cover. */
export function DiarioCard({ data, palette, showCover, showDeltas }: CardProps) {
  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      {/* Two glows: one from the top right, one from the bottom left. */}
      <Svg width={1080} height={1920} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient
            id="glow-top"
            cx={1080}
            cy={0}
            rx={900}
            ry={700}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset={0} stopColor={palette.accent2} stopOpacity={0.33} />
            <Stop offset={0.7} stopColor={palette.accent2} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient
            id="glow-bottom"
            cx={0}
            cy={1920}
            rx={900}
            ry={700}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset={0} stopColor={palette.accent} stopOpacity={0.33} />
            <Stop offset={0.7} stopColor={palette.accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={1080} height={1920} fill="url(#glow-top)" />
        <Rect width={1080} height={1920} fill="url(#glow-bottom)" />
      </Svg>
      <CardSparkle size={110} color={palette.accent2} style={{ top: 130, right: 110 }} />
      <CardSparkle size={50} color={palette.accent} style={{ top: 330, right: 260 }} />
      <CardSparkle size={40} color={palette.accent2} style={{ bottom: 420, left: 70 }} />

      <T face="mono" size={34} color={palette.muted} style={{ letterSpacing: 8.5 }}>
        MEU {data.unit.toUpperCase()} DE LEITURA
      </T>
      <View style={{ marginTop: 24 }}>
        <T
          face="italic"
          size={132}
          color={palette.ink}
          style={{ lineHeight: 150, textTransform: "capitalize" }}
        >
          {data.periodName}
        </T>
        <T face="italic" size={132} color={palette.muted} style={{ lineHeight: 150 }}>
          {data.kind === "year" ? "retrospectiva" : data.year}
        </T>
      </View>

      <View style={styles.hero}>
        {showCover && data.favorite && (
          <CardCover
            book={data.favorite}
            width={330}
            palette={palette}
            style={{ transform: [{ rotate: "-3deg" }] }}
          />
        )}
        <View style={{ gap: 50, flex: 1 }}>
          <Stat value={data.booksRead} label="livros" color={palette.accent} muted={palette.muted}>
            {showDeltas && (
              <Delta value={data.deltas.books} against={data.previousShort} palette={palette} />
            )}
          </Stat>
          <Stat
            value={data.pagesRead.toLocaleString("pt-BR")}
            label="páginas"
            color={palette.accent}
            muted={palette.muted}
          >
            {showDeltas && (
              <Delta value={data.deltas.pages} against={data.previousShort} palette={palette} />
            )}
          </Stat>
        </View>
      </View>

      <View style={[styles.panel, { backgroundColor: palette.paper }]}>
        <View style={styles.panelRow}>
          <Stat
            value={data.genre ?? "—"}
            label="gênero mais lido"
            color={palette.ink}
            muted={palette.muted}
            small
          />
          <Stat
            value={data.goal ? `${data.goal.percent}%` : "—"}
            label={data.goal ? `da meta de ${data.goal.target}` : "sem meta"}
            color={palette.ink}
            muted={palette.muted}
            small
          />
        </View>
        {data.favorite && (
          <T face="italic" size={44} color={palette.ink} lines={2}>
            <T face="mono" size={28} color={palette.muted} style={{ letterSpacing: 4.2 }}>
              FAVORITO ·{" "}
            </T>
            {data.favorite.title}
          </T>
        )}
      </View>

      <CardFooter username={data.username} palette={palette} style={{ marginTop: "auto" }} />
    </View>
  );
}

function Stat({
  value,
  label,
  color,
  muted,
  small,
  children,
}: {
  value: string | number;
  label: string;
  color: string;
  muted: string;
  small?: boolean;
  children?: ReactNode;
}) {
  const size = small ? 72 : 150;
  return (
    <View style={small ? { flex: 1 } : undefined}>
      <T face="serif" size={size} color={color} lines={1} style={{ lineHeight: size * 1.1 }}>
        {value}
      </T>
      <T face="mono" size={30} color={muted} style={{ letterSpacing: 4.5, marginTop: 10 }}>
        {label.toUpperCase()}
      </T>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "hidden", paddingTop: 120, paddingHorizontal: 96, paddingBottom: 96 },
  hero: { flexDirection: "row", alignItems: "center", gap: 70, marginTop: 110 },
  panel: {
    gap: 40,
    marginTop: 100,
    paddingVertical: 50,
    paddingHorizontal: 56,
    borderRadius: 40,
  },
  panelRow: { flexDirection: "row", gap: 40 },
});
