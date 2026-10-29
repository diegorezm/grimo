import { isDarkColor, ratingStars } from "@grimo/core";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { Rule, T } from "../parts";
import type { CardProps } from "../types";

const WIDTH = 860;
const TOOTH = 28;

/** Saw-tooth edge for the top and bottom of the receipt. */
function Edge({ color, flip }: { color: string; flip?: boolean }) {
  let d = `M 0 ${TOOTH}`;
  for (let x = 0; x < WIDTH; x += TOOTH) d += ` L ${x + TOOTH / 2} 0 L ${x + TOOTH} ${TOOTH}`;
  return (
    <Svg
      width={WIDTH}
      height={TOOTH}
      style={flip ? { transform: [{ rotate: "180deg" }] } : undefined}
    >
      <Path d={`${d} Z`} fill={color} />
    </Svg>
  );
}

/** Barcode stripes: the same 32 px pattern repeated across. */
function Barcode({ color, width }: { color: string; width: number }) {
  const bars: { x: number; w: number }[] = [];
  for (let x = 0; x < width; x += 32) {
    bars.push({ x, w: 6 }, { x: x + 10, w: 2 }, { x: x + 20, w: 8 });
  }
  return (
    <Svg width={width} height={130}>
      {bars.map((bar) => (
        <Rect key={bar.x} x={bar.x} y={0} width={bar.w} height={130} fill={color} />
      ))}
    </Svg>
  );
}

/** The period as a store receipt: itemized books, totals and a barcode. */
export function ReciboCard({ data, palette, showDeltas }: CardProps) {
  // Receipts are printed on light paper, whatever the palette.
  const dark = isDarkColor(palette.bg);
  const paper = dark ? palette.ink : palette.paper;
  const ink = dark ? palette.bg : palette.ink;
  const muted = dark ? `${palette.bg}A6` : palette.muted;
  const books = data.books.slice(0, 5);
  const delta = (value: number | null) =>
    showDeltas && value !== null ? ` (${value >= 0 ? "+" : ""}${value}%)` : "";
  const text = (size = 34) => ({ size, color: ink, face: "mono" as const });
  const center = { textAlign: "center" as const };
  const unit = data.unit.toUpperCase();

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <View style={styles.receipt}>
        <Edge color={paper} />
        <View style={[styles.body, { backgroundColor: paper }]}>
          <T {...text(64)} face="monoBold" style={[center, { letterSpacing: 6.4 }]}>
            ✦ GRIMO ✦
          </T>
          <T {...text()} color={muted} style={center}>
            LIVRARIA DO EU · DESDE SEMPRE
          </T>
          <Rule color={muted} style={styles.rule} />
          <T {...text(38)} style={center}>
            {data.kind === "year" ? "RETROSPECTIVA" : "RESUMO DE"} {data.periodLabel.toUpperCase()}
          </T>
          <T {...text()} color={muted} style={center}>
            CLIENTE: {data.name.toUpperCase()}
          </T>
          <Rule color={muted} style={styles.rule} />

          {books.length === 0 ? (
            <T {...text()} color={muted}>
              NENHUM LIVRO FECHADO ESTE {unit}
            </T>
          ) : (
            books.map((book) => (
              <Line
                key={book.title}
                left={`1x ${book.title.toUpperCase()}`}
                right={ratingStars(book.rating)}
                ink={ink}
                muted={muted}
              />
            ))
          )}
          {data.books.length > books.length && (
            <T {...text()} color={muted}>
              + {data.books.length - books.length} OUTROS
            </T>
          )}
          <Rule color={muted} style={styles.rule} />

          <Line
            left="LIVROS LIDOS"
            right={`${data.booksRead}${delta(data.deltas.books)}`}
            ink={ink}
            muted={muted}
          />
          <Line
            left={`GÊNERO DO ${unit}`}
            right={(data.genre ?? "—").toUpperCase()}
            ink={ink}
            muted={muted}
          />
          <Line
            left={`META ${data.year}`}
            right={data.goal ? `${data.goal.done}/${data.goal.target}` : "—"}
            ink={ink}
            muted={muted}
          />
          <Rule color={muted} style={styles.rule} />
          <View style={styles.total}>
            <T {...text(56)} face="monoBold">
              TOTAL
            </T>
            <T {...text(56)} face="monoBold">
              {data.pagesRead.toLocaleString("pt-BR")} PÁG
            </T>
          </View>
          {showDeltas && data.deltas.pages !== null && (
            <T {...text()} color={muted} style={{ textAlign: "right" }}>
              {delta(data.deltas.pages).trim()} VS {data.previousShort.toUpperCase()}
            </T>
          )}
          <Rule color={muted} style={styles.rule} />
          <T {...text()} style={[center, { marginTop: 10 }]}>
            OBRIGADO PELA LEITURA!
          </T>
          <T {...text()} color={muted} style={center}>
            VOLTE SEMPRE ✦
          </T>
          <View style={styles.barcode}>
            <Barcode color={ink} width={WIDTH - 140 - 60} />
          </View>
          {data.username && (
            <T {...text(28)} style={[center, { letterSpacing: 11 }]}>
              @{data.username}
            </T>
          )}
        </View>
        <Edge color={paper} flip />
      </View>
    </View>
  );
}

function Line({
  left,
  right,
  ink,
  muted,
}: {
  left: ReactNode;
  right: ReactNode;
  ink: string;
  muted: string;
}) {
  return (
    <View style={styles.line}>
      <T face="mono" size={34} color={ink} lines={1} style={{ maxWidth: 520 }}>
        {left}
      </T>
      <Rule color={muted} dash={[4, 8]} style={styles.dots} />
      <T face="mono" size={34} color={ink}>
        {right}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", padding: 80 },
  receipt: {
    width: WIDTH,
    transform: [{ rotate: "-1.5deg" }],
    boxShadow: "0 40px 60px rgba(0,0,0,0.3)",
  },
  body: { paddingTop: 40, paddingHorizontal: 70, paddingBottom: 50 },
  rule: { marginVertical: 30 },
  line: { flexDirection: "row", alignItems: "flex-end", gap: 16, marginVertical: 10 },
  dots: { flex: 1, marginBottom: 10 },
  total: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  barcode: { marginTop: 40, marginBottom: 14, marginHorizontal: 30 },
});
