import { type BookStoryData, type FinishedCardTemplate, quoteFontSize } from "@grimo/core";
import type { CardPalette } from "@grimo/tokens";
import { StyleSheet, View } from "react-native";
import { FINISHED_CARD_COMPONENTS } from "./finished";
import { CardCover, CardFooter, T } from "./parts";

/**
 * The Stories card of one book (1080×1920, same layout as the web): 5 finished-book designs
 * (Cantinho, Diário, Fita, Ficha, Cartaz) or a quote in big serif with its page and the book.
 */
export function BookStoryCard({
  data,
  palette,
  template = "cantinho",
  showDetails = true,
}: {
  data: BookStoryData;
  palette: CardPalette;
  template?: FinishedCardTemplate;
  showDetails?: boolean;
}) {
  if (!data.quote) {
    const Finished = FINISHED_CARD_COMPONENTS[template];
    return <Finished data={data} palette={palette} showDetails={showDetails} />;
  }

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <T face="mono" size={34} color={palette.muted} style={{ letterSpacing: 10 }}>
        {data.eyebrow}
      </T>

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

      <CardFooter username={data.username} palette={palette} />
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
});
