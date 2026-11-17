import { isDarkColor } from "@grimo/core";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { CardCover, CardFooter, T } from "../parts";
import { type FinishedCardProps, RatingRow } from "./shared";

/** Editorial journal page: review excerpt, feelings, pages, dates and reading pace. */
export function DiarioFinishedCard({ data, palette, showDetails = true }: FinishedCardProps) {
  const dark = isDarkColor(palette.bg);
  const d = data.details;
  const accentText = dark ? palette.accent2 : palette.accent;

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <Svg width={1080} height={1920} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient
            id="glow-d-top"
            cx={1080}
            cy={0}
            rx={780}
            ry={620}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset={0} stopColor={palette.accent2} stopOpacity={0.24} />
            <Stop offset={0.7} stopColor={palette.accent2} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient
            id="glow-d-bot"
            cx={0}
            cy={1920}
            rx={780}
            ry={620}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset={0} stopColor={palette.accent} stopOpacity={0.22} />
            <Stop offset={0.7} stopColor={palette.accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={1080} height={1920} fill="url(#glow-d-top)" />
        <Rect width={1080} height={1920} fill="url(#glow-d-bot)" />
      </Svg>

      <View style={styles.top}>
        <T face="mono" size={28} color={palette.muted} style={{ letterSpacing: 7 }}>
          {data.eyebrow}
        </T>
        {showDetails && d?.yearRank ? (
          <View style={[styles.badge, { borderColor: palette.accent }]}>
            <T face="mono" size={26} color={accentText} style={{ letterSpacing: 3 }}>
              #{d.yearRank.index} DE {d.yearRank.year}
            </T>
          </View>
        ) : null}
      </View>

      <T face="italic" size={92} color={palette.ink} style={{ lineHeight: 96, marginTop: 32 }}>
        {data.headline}
      </T>

      <View style={styles.hero}>
        <CardCover book={data.book} width={230} palette={palette} />
        <View style={styles.flex}>
          <T
            face="italic"
            size={data.book.title.length > 34 ? 46 : 56}
            color={palette.ink}
            lines={3}
            style={{ lineHeight: data.book.title.length > 34 ? 52 : 62 }}
          >
            {data.book.title}
          </T>
          <T size={34} color={accentText} lines={2} style={{ marginTop: 10 }}>
            {data.book.authors.join(", ")}
          </T>
          <View style={{ marginTop: 22 }}>
            <RatingRow
              rating={data.book.rating}
              color={accentText}
              muted={palette.muted}
              size={38}
            />
          </View>
        </View>
      </View>

      {showDetails && d?.reviewExcerpt ? (
        <View
          style={[
            styles.quoteBox,
            { backgroundColor: palette.paper, borderLeftColor: palette.accent },
          ]}
        >
          <T face="italic" size={36} color={palette.ink} style={{ lineHeight: 50 }}>
            “{d.reviewExcerpt}”
          </T>
        </View>
      ) : (
        showDetails &&
        (d?.genre || d?.publishedYear) && (
          <T
            face="mono"
            size={28}
            color={palette.muted}
            style={{ marginTop: 48, letterSpacing: 4 }}
          >
            {[d.genre, d.publishedYear].filter(Boolean).join(" · ").toUpperCase()}
          </T>
        )
      )}

      {showDetails && d && d.feelings.length > 0 && (
        <View style={styles.feelings}>
          {d.feelings.map((feeling) => (
            <View key={feeling} style={[styles.chip, { backgroundColor: palette.paper }]}>
              <T face="mono" size={27} color={palette.ink} style={{ letterSpacing: 1.5 }}>
                {feeling}
              </T>
            </View>
          ))}
        </View>
      )}

      {d && (d.pages || d.days !== null) && (
        <View style={[styles.stats, { borderTopColor: palette.paper }]}>
          <View style={styles.statCol}>
            <T face="heavy" size={44} color={palette.ink}>
              {d.pages ?? "—"}
            </T>
            <T
              face="mono"
              size={24}
              color={palette.muted}
              style={{ letterSpacing: 2.4, marginTop: 8 }}
            >
              PÁGINAS
            </T>
          </View>
          <View style={styles.statCol}>
            <T face="heavy" size={44} color={palette.ink}>
              {d.days !== null ? `${d.days} ${d.days === 1 ? "dia" : "dias"}` : "—"}
            </T>
            <T
              face="mono"
              size={22}
              color={palette.muted}
              style={{ letterSpacing: 2, marginTop: 8 }}
            >
              {d.periodRange ? d.periodRange.toUpperCase() : "DURAÇÃO"}
            </T>
          </View>
          <View style={styles.statCol}>
            <T face="heavy" size={44} color={palette.ink}>
              {d.pagesPerDay ? `${d.pagesPerDay}/dia` : (d.finishedMonth ?? "—")}
            </T>
            <T
              face="mono"
              size={24}
              color={palette.muted}
              style={{ letterSpacing: 2.4, marginTop: 8 }}
            >
              {d?.pagesPerDay ? "RITMO" : "CONCLUÍDO"}
            </T>
          </View>
        </View>
      )}

      <CardFooter username={data.username} palette={palette} style={{ marginTop: "auto" }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 1080,
    height: 1920,
    paddingTop: 86,
    paddingHorizontal: 76,
    paddingBottom: 72,
  },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badge: { borderWidth: 2, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 22 },
  hero: { flexDirection: "row", alignItems: "center", gap: 44, marginTop: 48 },
  flex: { flex: 1 },
  quoteBox: {
    marginTop: 48,
    paddingVertical: 32,
    paddingHorizontal: 36,
    borderRadius: 24,
    borderLeftWidth: 8,
  },
  feelings: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 36 },
  chip: { borderRadius: 999, paddingVertical: 10, paddingHorizontal: 24 },
  stats: {
    flexDirection: "row",
    gap: 24,
    marginTop: 48,
    paddingTop: 36,
    borderTopWidth: 2,
  },
  statCol: { flex: 1 },
});
