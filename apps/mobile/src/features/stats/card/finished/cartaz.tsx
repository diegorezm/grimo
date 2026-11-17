import { isDarkColor } from "@grimo/core";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";
import { CardCover, CardFooter, T } from "../parts";
import { buildDetailPills, type FinishedCardProps, RatingRow } from "./shared";

/** Minimalist poster centered on a large cover with a warm aura and crisp detail pills. */
export function CartazFinishedCard({ data, palette, showDetails = true }: FinishedCardProps) {
  const dark = isDarkColor(palette.bg);
  const d = data.details;
  const accentText = dark ? palette.accent2 : palette.accent;
  const pills = buildDetailPills(data, showDetails);

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <Svg width={1080} height={1920} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="cartaz-bg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={palette.paper} />
            <Stop offset="62%" stopColor={palette.bg} />
          </LinearGradient>
          <RadialGradient
            id="cartaz-aura"
            cx={540}
            cy={780}
            rx={420}
            ry={420}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor={palette.accent} stopOpacity={dark ? 0.38 : 0.24} />
            <Stop offset="70%" stopColor={palette.accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={1080} height={1920} fill="url(#cartaz-bg)" />
        <Rect width={1080} height={1920} fill="url(#cartaz-aura)" />
      </Svg>

      <View style={styles.top}>
        <T face="mono" size={28} color={palette.muted} style={{ letterSpacing: 6.5 }}>
          {d?.finishedMonth ? `CONCLUÍDO · ${d.finishedMonth}` : data.eyebrow}
        </T>
        <RatingRow rating={data.book.rating} color={accentText} muted={palette.muted} size={32} />
      </View>

      <View style={styles.center}>
        <CardCover book={data.book} width={440} palette={palette} />
      </View>

      <View
        style={[
          styles.panel,
          {
            backgroundColor: `${palette.paper}E6`,
            borderColor: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
          },
        ]}
      >
        <T
          face="italic"
          size={data.book.title.length > 34 ? 52 : 64}
          color={palette.ink}
          lines={3}
          style={{ lineHeight: data.book.title.length > 34 ? 58 : 70 }}
        >
          {data.book.title}
        </T>
        <T size={34} color={accentText} lines={1} style={{ marginTop: 10 }}>
          {[data.book.authors.join(", "), showDetails ? d?.periodRange : null]
            .filter(Boolean)
            .join(" · ")}
        </T>

        {pills.length > 0 && (
          <View style={styles.pills}>
            {pills.map((pill) => (
              <View
                key={pill.label}
                style={[
                  styles.pill,
                  { backgroundColor: pill.accent ? palette.accent : palette.bg },
                ]}
              >
                <T
                  face={pill.accent ? "monoBold" : "mono"}
                  size={25}
                  color={pill.accent ? (dark ? palette.bg : "#FFFFFF") : palette.ink}
                  style={{ letterSpacing: 1.5 }}
                >
                  {pill.label}
                </T>
              </View>
            ))}
          </View>
        )}

        <View style={{ marginTop: 34 }}>
          <CardFooter
            username={
              data.username && showDetails && d?.yearRank
                ? `${data.username} · #${d.yearRank.index} DE ${d.yearRank.year}`
                : data.username
            }
            palette={palette}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 1080,
    height: 1920,
    paddingTop: 82,
    paddingHorizontal: 72,
    paddingBottom: 68,
  },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  panel: {
    borderRadius: 34,
    paddingTop: 42,
    paddingHorizontal: 44,
    paddingBottom: 38,
    borderWidth: 2,
  },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 26 },
  pill: { borderRadius: 12, paddingVertical: 8, paddingHorizontal: 20 },
});
