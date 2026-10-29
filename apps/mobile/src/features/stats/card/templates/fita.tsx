import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { CardCover, CardFooter, CardSparkle, Delta, T } from "../parts";
import type { CardProps } from "../types";

const RIBBON = "M -120 520 C 260 260 820 160 960 470 S 520 900 760 1080 S 1240 1180 1200 1400";

/** Bold "year in sport" style: a thick ribbon swooping behind the cover, big stats. */
export function FitaCard({ data, palette, showCover, showDeltas }: CardProps) {
  const stats = [
    { label: "Livros lidos", value: data.booksRead, delta: data.deltas.books },
    { label: "Páginas", value: data.pagesRead.toLocaleString("pt-BR"), delta: data.deltas.pages },
    { label: `Gênero do ${data.unit}`, value: data.genre ?? "—", delta: null },
    {
      label: `Meta de ${data.year}`,
      value: data.goal ? `${data.goal.percent}%` : "—",
      delta: null,
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      {/* The ribbon, with thin echo lines beside it. */}
      <Svg viewBox="0 0 1080 1920" width={1080} height={1920} style={StyleSheet.absoluteFill}>
        {[-70, -40].map((offset) => (
          <Path
            key={offset}
            d={RIBBON}
            translate={[offset, offset]}
            fill="none"
            stroke={palette.accent2}
            strokeOpacity={0.35}
            strokeWidth={4}
          />
        ))}
        <Path
          d={RIBBON}
          fill="none"
          stroke={palette.accent}
          strokeWidth={150}
          strokeLinecap="round"
        />
      </Svg>

      <View style={styles.head}>
        <T face="mono" size={34} color={palette.ink} style={{ letterSpacing: 10 }}>
          GRIMO
        </T>
        {[`MEU ${data.unit.toUpperCase()}`, "DE LEITURA"].map((line) => (
          <View key={line} style={{ backgroundColor: palette.bg, paddingHorizontal: 28 }}>
            <T face="heavy" size={112} color={palette.ink} style={styles.headline}>
              {line}
            </T>
          </View>
        ))}
        <View style={[styles.pill, { borderColor: palette.ink, backgroundColor: palette.bg }]}>
          <T face="mono" size={34} color={palette.ink} style={styles.pillText}>
            {data.kind === "year" ? `Retrospectiva ${data.year}` : data.periodLabel}
          </T>
        </View>
      </View>

      <View style={styles.middle}>
        {showCover && data.favorite ? (
          <CardCover
            book={data.favorite}
            width={400}
            palette={palette}
            style={{
              transform: [{ rotate: "-4deg" }],
              borderWidth: 14,
              borderColor: palette.paper,
            }}
          />
        ) : (
          <View style={{ alignItems: "center", backgroundColor: palette.bg, padding: 40 }}>
            <T face="heavy" size={340} color={palette.ink} style={{ lineHeight: 360 }}>
              {data.booksRead}
            </T>
            <T face="mono" size={40} color={palette.ink} style={{ letterSpacing: 8 }}>
              LIVROS
            </T>
          </View>
        )}
        <CardSparkle size={90} color={palette.accent2} style={{ top: 40, right: 60 }} />
      </View>

      <View style={styles.stats}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.stat}>
            <T face="mono" size={30} color={palette.muted} style={{ letterSpacing: 3.6 }}>
              {stat.label.toUpperCase()}
            </T>
            <T face="heavy" size={88} color={palette.ink} lines={1} style={{ lineHeight: 98 }}>
              {stat.value}
            </T>
            {showDeltas && (
              <Delta value={stat.delta} against={data.previousShort} palette={palette} />
            )}
          </View>
        ))}
      </View>

      <CardFooter username={data.username} palette={palette} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "hidden", paddingTop: 110, paddingHorizontal: 90, paddingBottom: 90 },
  head: { alignItems: "center", gap: 14 },
  headline: { lineHeight: 120, letterSpacing: -2 },
  pill: {
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 999,
    borderWidth: 3,
  },
  pillText: { letterSpacing: 5, textTransform: "uppercase" },
  middle: { height: 640, marginTop: 30, alignItems: "center", justifyContent: "center" },
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 60,
    rowGap: 56,
    marginTop: "auto",
    marginBottom: 70,
  },
  stat: { width: 420 },
});
