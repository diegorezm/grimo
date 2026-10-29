import { ratingStars } from "@grimo/core";
import { StyleSheet, View } from "react-native";
import { CardFooter, CardSparkle, Delta, T } from "../parts";
import type { CardProps } from "../types";

/** Spine heights/widths cycle so the shelf looks hand-arranged. */
const SPINES = [
  { h: 620, w: 120 },
  { h: 560, w: 100 },
  { h: 660, w: 130 },
  { h: 590, w: 110 },
  { h: 640, w: 96 },
  { h: 575, w: 124 },
];

/** The period's books as spines on a shelf, numbers below. */
export function EstanteCard({ data, palette, showDeltas }: CardProps) {
  const colors = [palette.accent, palette.accent2, palette.paper, palette.ink, palette.muted];
  const books = data.books.slice(0, 6);
  const placeholders = books.length === 0 ? 3 : 0;

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <CardSparkle size={70} color={palette.accent2} style={{ top: 120, right: 100 }} />
      <T face="mono" size={34} color={palette.muted} style={{ letterSpacing: 8.5 }}>
        {data.kind === "year" ? "MINHA ESTANTE DE" : "NA ESTANTE EM"}
      </T>
      <T
        face="italic"
        size={150}
        color={palette.ink}
        style={{ lineHeight: 170, marginTop: 16, textTransform: "capitalize" }}
      >
        {data.periodName}
      </T>

      {/* Shelf */}
      <View style={{ marginTop: 110 }}>
        <View style={styles.shelf}>
          {books.map((book, i) => {
            const spine = SPINES[i % SPINES.length]!;
            const bg = colors[i % colors.length]!;
            const ink = bg === palette.paper ? palette.ink : palette.bg;
            const last = i === books.length - 1 && books.length > 1;
            return (
              <View
                key={book.title}
                style={[
                  styles.spine,
                  { height: spine.h, width: spine.w, backgroundColor: bg },
                  last && { transform: [{ rotate: "9deg" }], marginLeft: 30 },
                ]}
              >
                <View style={[styles.bar, { backgroundColor: ink }]} />
                {/* Title running bottom to top, like a real spine. */}
                <View
                  style={[
                    styles.title,
                    {
                      width: spine.h - 140,
                      height: spine.w,
                      left: (spine.w - (spine.h - 140)) / 2,
                      top: (spine.h - spine.w) / 2,
                    },
                  ]}
                >
                  <T face="italic" size={38} color={ink} lines={1}>
                    {book.title}
                  </T>
                </View>
                <View style={[styles.bar, { backgroundColor: ink }]} />
              </View>
            );
          })}
          {Array.from({ length: placeholders }, (_, i) => (
            <View
              key={`empty-${String(i)}`}
              style={[
                styles.empty,
                { height: SPINES[i]!.h, width: SPINES[i]!.w, borderColor: palette.muted },
              ]}
            />
          ))}
        </View>
        <View style={{ height: 26, backgroundColor: palette.accent, borderRadius: 6 }} />
        <View
          style={{
            height: 22,
            marginHorizontal: 30,
            backgroundColor: palette.paper,
            opacity: 0.35,
          }}
        />
      </View>

      <View style={styles.numbers}>
        <View style={styles.number}>
          <T face="heavy" size={150} color={palette.ink} style={{ lineHeight: 160 }}>
            {data.booksRead}
          </T>
          <T face="mono" size={32} color={palette.muted} style={{ letterSpacing: 4.8 }}>
            {data.booksRead === 1 ? "LIVRO TERMINADO" : "LIVROS TERMINADOS"}
          </T>
          {showDeltas && (
            <Delta value={data.deltas.books} against={data.previousShort} palette={palette} />
          )}
        </View>
        <View style={styles.number}>
          <T face="heavy" size={150} color={palette.ink} lines={1} style={{ lineHeight: 160 }}>
            {data.pagesRead.toLocaleString("pt-BR")}
          </T>
          <T face="mono" size={32} color={palette.muted} style={{ letterSpacing: 4.8 }}>
            PÁGINAS LIDAS
          </T>
          {showDeltas && (
            <Delta value={data.deltas.pages} against={data.previousShort} palette={palette} />
          )}
        </View>
      </View>

      {data.favorite && (
        <T face="italic" size={46} color={palette.ink} lines={2} style={{ marginTop: 70 }}>
          Favorito: {data.favorite.title}{" "}
          <T face="sans" size={46} color={palette.accent2}>
            {ratingStars(data.favorite.rating)}
          </T>
        </T>
      )}

      <CardFooter username={data.username} palette={palette} style={{ marginTop: "auto" }} />
    </View>
  );
}

const spineCorners = {
  borderTopLeftRadius: 10,
  borderTopRightRadius: 10,
  borderBottomLeftRadius: 4,
  borderBottomRightRadius: 4,
};

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "hidden", paddingTop: 120, paddingHorizontal: 90, paddingBottom: 90 },
  shelf: { flexDirection: "row", alignItems: "flex-end", gap: 18, height: 680, paddingLeft: 20 },
  spine: {
    ...spineCorners,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 28,
    boxShadow: "inset -10px 0 0 rgba(0,0,0,0.12)",
    transformOrigin: "left bottom",
  },
  bar: { width: "60%", height: 6, opacity: 0.5, borderRadius: 3 },
  title: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-90deg" }],
  },
  empty: { ...spineCorners, borderWidth: 5, borderStyle: "dashed", opacity: 0.6 },
  numbers: { flexDirection: "row", gap: 50, marginTop: 90 },
  number: { flex: 1 },
});
