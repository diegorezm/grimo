import { isDarkColor } from "@grimo/core";
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { CardCover, CardFooter, T } from "../parts";
import { type FinishedCardProps, RatingRow } from "./shared";

const RIBBON = "M -120 560 C 270 300 840 210 960 540 S 510 960 780 1170 S 1230 1290 1170 1500";

/** Bold "Fita" style for a single finished book: swooping ribbon, pacing, genre and goal. */
export function FitaFinishedCard({ data, palette, showDetails = true }: FinishedCardProps) {
  const dark = isDarkColor(palette.bg);
  const d = data.details;
  const accentText = dark ? palette.accent2 : palette.accent;

  const pillParts: string[] = [];
  if (d?.days !== null && d?.days !== undefined) {
    pillParts.push(`EM ${d.days} ${d.days === 1 ? "DIA" : "DIAS"}`);
  }
  if (d?.pagesPerDay) {
    pillParts.push(`${d.pagesPerDay} PÁG/DIA`);
  } else if (d?.pages) {
    pillParts.push(`${d.pages} PÁGINAS`);
  }

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <Svg viewBox="0 0 1080 1920" width={1080} height={1920} style={StyleSheet.absoluteFill}>
        {[-55, -28].map((offset) => (
          <Path
            key={offset}
            d={RIBBON}
            translate={[offset, offset]}
            fill="none"
            stroke={palette.accent2}
            strokeOpacity={0.35}
            strokeWidth={5}
          />
        ))}
        <Path
          d={RIBBON}
          fill="none"
          stroke={palette.accent}
          strokeWidth={140}
          strokeLinecap="round"
        />
      </Svg>

      <View style={styles.head}>
        <T face="mono" size={30} color={palette.muted} style={{ letterSpacing: 8 }}>
          {data.eyebrow}
        </T>
        <View style={{ backgroundColor: palette.bg, paddingHorizontal: 30, paddingVertical: 8 }}>
          <T
            face="heavy"
            size={82}
            color={palette.ink}
            style={{ lineHeight: 84, letterSpacing: -1.5 }}
          >
            TERMINEI
          </T>
        </View>
        {pillParts.length > 0 && (
          <View style={[styles.pill, { borderColor: palette.ink, backgroundColor: palette.bg }]}>
            <T face="mono" size={28} color={palette.ink} style={{ letterSpacing: 4 }}>
              {pillParts.join(" · ")}
            </T>
          </View>
        )}
      </View>

      <View style={styles.coverWrap}>
        <CardCover
          book={data.book}
          width={330}
          palette={palette}
          style={{
            transform: [{ rotate: "-4deg" }],
            borderWidth: 12,
            borderColor: palette.paper,
          }}
        />
      </View>

      <View style={styles.titleBlock}>
        <View
          style={{
            backgroundColor: palette.bg,
            paddingHorizontal: 26,
            paddingVertical: 6,
            borderRadius: 14,
          }}
        >
          <T
            face="italic"
            size={data.book.title.length > 32 ? 46 : 58}
            color={palette.ink}
            lines={2}
            style={{ textAlign: "center", lineHeight: data.book.title.length > 32 ? 52 : 66 }}
          >
            {data.book.title}
          </T>
        </View>
        <View
          style={{
            backgroundColor: palette.bg,
            paddingHorizontal: 20,
            paddingVertical: 4,
            borderRadius: 10,
            marginTop: 10,
          }}
        >
          <T size={32} color={accentText} lines={1}>
            {[data.book.authors.join(", "), showDetails ? d?.publishedYear : null]
              .filter(Boolean)
              .join(" · ")}
          </T>
        </View>
      </View>

      <View style={[styles.metrics, { backgroundColor: `${palette.paper}EA` }]}>
        <View style={styles.metric}>
          <T face="mono" size={24} color={palette.muted} style={{ letterSpacing: 2.8 }}>
            NOTA
          </T>
          <View style={{ marginTop: 10 }}>
            {data.book.rating ? (
              <RatingRow
                rating={data.book.rating}
                color={accentText}
                muted={palette.muted}
                size={34}
              />
            ) : (
              <T face="heavy" size={44} color={palette.ink}>
                —
              </T>
            )}
          </View>
        </View>
        <View style={styles.metric}>
          <T face="mono" size={24} color={palette.muted} style={{ letterSpacing: 2.8 }}>
            EXTENSÃO
          </T>
          <T face="heavy" size={48} color={palette.ink} lines={1} style={{ marginTop: 6 }}>
            {d?.pages ? `${d.pages} pág` : "—"}
          </T>
        </View>
        <View style={styles.metric}>
          <T face="mono" size={24} color={palette.muted} style={{ letterSpacing: 2.8 }}>
            {showDetails && d?.genre ? "GÊNERO" : "CONCLUÍDO"}
          </T>
          <T face="heavy" size={42} color={palette.ink} lines={1} style={{ marginTop: 6 }}>
            {(showDetails && d?.genre) || d?.finishedMonth || "—"}
          </T>
        </View>
        <View style={styles.metric}>
          <T face="mono" size={24} color={palette.muted} style={{ letterSpacing: 2.8 }}>
            {d?.yearRank ? `META ${d.yearRank.year}` : "SENSAÇÃO"}
          </T>
          <T face="heavy" size={48} color={accentText} lines={1} style={{ marginTop: 6 }}>
            {d?.yearRank
              ? d.yearRank.target
                ? `${d.yearRank.index} / ${d.yearRank.target}`
                : `#${d.yearRank.index}`
              : (d?.feelings[0] ?? "—")}
          </T>
        </View>
      </View>

      <CardFooter username={data.username} palette={palette} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 1080,
    height: 1920,
    paddingTop: 88,
    paddingHorizontal: 72,
    paddingBottom: 72,
  },
  head: { alignItems: "center", gap: 14 },
  pill: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 999,
    borderWidth: 3,
  },
  coverWrap: { alignItems: "center", justifyContent: "center", marginTop: 48 },
  titleBlock: { alignItems: "center", marginTop: 38 },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 42,
    rowGap: 30,
    marginTop: "auto",
    marginBottom: 42,
    paddingVertical: 32,
    paddingHorizontal: 36,
    borderRadius: 28,
  },
  metric: { width: "45%" },
});
