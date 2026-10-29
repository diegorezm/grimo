import type { GroupCardData } from "@grimo/core";
import type { CardPalette } from "@grimo/tokens";
import { StyleSheet, View } from "react-native";
import { CardCover, CardFooter, CardSparkle, T } from "@/features/stats";

/**
 * The Juntos story card (1080×1920, same layout as the web): the book, then each reader's bar.
 * When everyone finished it becomes "Terminamos juntos".
 */
export function GroupCard({ data, palette }: { data: GroupCardData; palette: CardPalette }) {
  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <CardSparkle size={110} color={palette.accent2} style={{ top: 120, right: 110 }} />
      <CardSparkle size={60} color={palette.accent} style={{ bottom: 330, right: 90 }} />

      <T face="mono" size={34} color={palette.muted} style={{ letterSpacing: 10 }}>
        GRIMO · JUNTOS
      </T>
      <T face="italic" size={132} color={palette.ink} style={styles.headline}>
        {data.headline}
      </T>

      <View style={styles.book}>
        <CardCover book={data.book} width={300} palette={palette} />
        <View style={styles.flex}>
          <T face="italic" size={64} color={palette.ink} lines={4} style={{ lineHeight: 70 }}>
            {data.book.title}
          </T>
          <T size={38} color={palette.accent} lines={2} style={{ marginTop: 16 }}>
            {data.book.authors.join(", ")}
          </T>
        </View>
      </View>

      <View style={styles.members}>
        {data.members.map((member) => (
          <View key={member.name} style={styles.member}>
            <View style={[styles.initial, { backgroundColor: palette.paper }]}>
              <T face="serif" size={44} color={palette.ink}>
                {member.initial}
              </T>
            </View>
            <T size={40} color={palette.ink} lines={1} style={{ width: 210, fontWeight: "600" }}>
              {member.name}
            </T>
            <View style={[styles.track, { backgroundColor: palette.paper }]}>
              <View
                style={[
                  styles.fill,
                  { width: `${member.percent}%`, backgroundColor: palette.accent },
                ]}
              />
            </View>
            <T face="mono" size={36} color={palette.ink} style={styles.percent}>
              {member.percent}%
            </T>
          </View>
        ))}
        {data.more > 0 && (
          <T face="mono" size={32} color={palette.muted}>
            + {data.more} {data.more === 1 ? "leitor" : "leitores"}
          </T>
        )}
      </View>

      <T
        face="mono"
        size={40}
        color={data.finished ? palette.accent : palette.ink}
        style={styles.summary}
      >
        {data.summary.toUpperCase()}
      </T>
      <CardFooter username={data.username} palette={palette} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: 1080, height: 1920, paddingTop: 110, paddingHorizontal: 90, paddingBottom: 90 },
  headline: { lineHeight: 140, marginTop: 30 },
  book: { flexDirection: "row", alignItems: "flex-end", gap: 50, marginTop: 70 },
  flex: { flex: 1, paddingBottom: 10 },
  members: { gap: 34, marginTop: 90 },
  member: { flexDirection: "row", alignItems: "center", gap: 28 },
  initial: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  track: { flex: 1, height: 22, borderRadius: 11, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 11 },
  percent: { width: 130, textAlign: "right" },
  summary: { marginTop: "auto", marginBottom: 60, letterSpacing: 5 },
});
