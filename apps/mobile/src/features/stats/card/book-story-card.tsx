import { type BookStoryData, quoteFontSize } from "@grimo/core";
import type { CardPalette } from "@grimo/tokens";
import { StyleSheet, View } from "react-native";
import { CardCover, CardFooter, CardSparkle, T } from "./parts";

/**
 * The Stories card of one book (1080×1920, same layout as the web): "Terminei de ler" with the
 * cover, stars and how long it took, or a quote in big serif with its page and the book.
 */
export function BookStoryCard({ data, palette }: { data: BookStoryData; palette: CardPalette }) {
  const rating = data.book.rating ?? 0;
  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <CardSparkle size={110} color={palette.accent2} style={{ top: 120, right: 110 }} />
      <T face="mono" size={34} color={palette.muted} style={{ letterSpacing: 10 }}>
        {data.eyebrow}
      </T>

      {data.quote ? (
        <>
          <T face="serif" size={260} color={palette.accent} style={styles.mark}>
            “
          </T>
          <T
            face="italic"
            size={quoteFontSize(data.quote.body)}
            color={palette.ink}
            style={{ lineHeight: quoteFontSize(data.quote.body) * 1.2 }}
          >
            {data.quote.body}
          </T>
          {data.quote.page ? (
            <T face="mono" size={36} color={palette.muted} style={styles.page}>
              P. {data.quote.page}
            </T>
          ) : null}
          <View style={styles.source}>
            <CardCover book={data.book} width={150} palette={palette} />
            <View style={styles.flex}>
              <T face="italic" size={48} color={palette.ink} lines={3}>
                {data.book.title}
              </T>
              <T size={34} color={palette.accent} lines={2} style={{ marginTop: 10 }}>
                {data.book.authors.join(", ")}
              </T>
            </View>
          </View>
        </>
      ) : (
        <>
          <T face="italic" size={132} color={palette.ink} style={styles.headline}>
            {data.headline}
          </T>
          <CardCover book={data.book} width={480} palette={palette} style={{ marginTop: 90 }} />
          <T face="italic" size={72} color={palette.ink} lines={3} style={styles.title}>
            {data.book.title}
          </T>
          <T size={40} color={palette.accent} lines={2} style={{ marginTop: 16 }}>
            {data.book.authors.join(", ")}
          </T>
          {rating > 0 && (
            <T size={80} color={palette.accent2} style={styles.stars}>
              {"★".repeat(rating)}
              <T size={80} color={palette.paper}>
                {"★".repeat(5 - rating)}
              </T>
            </T>
          )}
          {data.summary && (
            <T face="mono" size={40} color={palette.ink} style={styles.summary}>
              {data.summary.toUpperCase()}
            </T>
          )}
        </>
      )}
      <CardFooter
        username={data.username}
        palette={palette}
        style={data.summary || data.quote ? undefined : { marginTop: "auto" }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: 1080, height: 1920, paddingTop: 110, paddingHorizontal: 90, paddingBottom: 90 },
  mark: { lineHeight: 220, marginTop: 90 },
  page: { marginTop: 40, letterSpacing: 4 },
  source: {
    flexDirection: "row",
    alignItems: "center",
    gap: 40,
    marginTop: "auto",
    marginBottom: 70,
  },
  flex: { flex: 1 },
  headline: { lineHeight: 140, marginTop: 30 },
  title: { lineHeight: 80, marginTop: 70 },
  stars: { marginTop: 40, letterSpacing: 8 },
  summary: { marginTop: "auto", marginBottom: 60, letterSpacing: 5 },
});
