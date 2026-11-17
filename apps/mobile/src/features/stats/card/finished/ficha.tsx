import { isDarkColor } from "@grimo/core";
import type { CardPalette } from "@grimo/tokens";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { CardCover, CardFooter, T } from "../parts";
import { type FinishedCardProps, RatingRow } from "./shared";

/** Library catalog card ("arquivo" aesthetic): stamp, ruled rows and diary highlights. */
export function FichaFinishedCard({ data, palette, showDetails = true }: FinishedCardProps) {
  const dark = isDarkColor(palette.bg);
  const d = data.details;

  const cardBg = dark ? palette.ink : palette.paper;
  const cardInk = dark ? palette.bg : palette.ink;
  const cardMuted = dark ? `${palette.bg}99` : palette.muted;
  const cardAccent = dark ? palette.bg : palette.accent;
  const lineBorder = dark ? "rgba(23,18,30,0.16)" : "rgba(0,0,0,0.12)";

  const editionParts = [
    d?.pages ? `${d.pages} pág` : null,
    d?.pagesPerDay ? `${d.pagesPerDay} pág/dia` : null,
  ].filter(Boolean);

  const periodText = d?.periodRange
    ? `${d.periodRange}${d.days ? ` (${d.days}d)` : ""}`
    : d?.days
      ? `${d.days} ${d.days === 1 ? "dia" : "dias"}`
      : (d?.finishedMonth ?? "Concluído");

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        {/* Library stamp */}
        <View style={[styles.stamp, { borderColor: cardAccent }]}>
          <T face="monoBold" size={23} color={cardAccent} style={styles.stampText}>
            LIDO
          </T>
          {d?.finishedStamp ? (
            <T face="monoBold" size={23} color={cardAccent} style={styles.stampText}>
              {d.finishedStamp}
            </T>
          ) : null}
        </View>

        <T face="mono" size={26} color={cardMuted} style={{ letterSpacing: 5.5 }}>
          {d?.yearRank ? `FICHA DE LEITURA · Nº ${d.yearRank.index}` : "FICHA DE LEITURA"}
        </T>

        <View style={styles.headRow}>
          <CardCover book={data.book} width={164} palette={palette} />
          <View style={styles.flex}>
            <T
              face="italic"
              size={data.book.title.length > 32 ? 44 : 52}
              color={cardInk}
              lines={3}
              style={{ lineHeight: data.book.title.length > 32 ? 50 : 58 }}
            >
              {data.book.title}
            </T>
            <T size={32} color={cardMuted} lines={2} style={{ marginTop: 10 }}>
              {data.book.authors.join(", ")}
            </T>
            {(d?.genre || d?.publishedYear) && (
              <T
                face="mono"
                size={26}
                color={cardAccent}
                style={{ marginTop: 10, letterSpacing: 2.5 }}
              >
                {[d?.genre, d?.publishedYear].filter(Boolean).join(" · ").toUpperCase()}
              </T>
            )}
          </View>
        </View>

        <View style={[styles.rule, { borderTopColor: cardInk }]} />

        <FichaRow label="Avaliação" muted={cardMuted} border={lineBorder}>
          {data.book.rating ? (
            <RatingRow rating={data.book.rating} color={cardAccent} muted={cardMuted} size={32} />
          ) : (
            <T face="heavy" size={31} color={cardInk}>
              Sem nota
            </T>
          )}
        </FichaRow>
        <FichaRow label="Período" muted={cardMuted} border={lineBorder}>
          <T face="heavy" size={31} color={cardInk}>
            {periodText}
          </T>
        </FichaRow>
        {editionParts.length > 0 && (
          <FichaRow label="Edição" muted={cardMuted} border={lineBorder}>
            <T face="heavy" size={31} color={cardInk}>
              {editionParts.join(" · ")}
            </T>
          </FichaRow>
        )}
        {showDetails && d && d.feelings.length > 0 && (
          <FichaRow label="Sensações" muted={cardMuted} border={lineBorder}>
            <T face="heavy" size={31} color={cardInk}>
              {d.feelings.join(", ")}
            </T>
          </FichaRow>
        )}
        {showDetails && d && d.rereadCount > 0 && (
          <FichaRow label="Releitura" muted={cardMuted} border={lineBorder}>
            <T face="heavy" size={31} color={cardInk}>
              {d.rereadCount + 1}ª leitura
            </T>
          </FichaRow>
        )}

        {showDetails && d && d.diaryMarks.length > 0 ? (
          <View style={{ marginTop: 32 }}>
            <T
              face="mono"
              size={24}
              color={cardMuted}
              style={{ letterSpacing: 3.5, marginBottom: 14 }}
            >
              TRILHA DO DIÁRIO
            </T>
            <View style={{ gap: 14 }}>
              {d.diaryMarks.map((mark, index) => (
                <View key={`${mark.page}-${index}`} style={styles.trailItem}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: index % 2 === 0 ? palette.accent : palette.accent2 },
                    ]}
                  />
                  <T face="mono" size={27} color={cardMuted}>
                    p. {mark.page}
                  </T>
                  <T size={30} color={cardInk} lines={1} style={styles.flex}>
                    {mark.feelings.join(" · ")}
                  </T>
                </View>
              ))}
            </View>
          </View>
        ) : (
          showDetails &&
          d?.reviewExcerpt && (
            <View style={{ marginTop: 32 }}>
              <T
                face="mono"
                size={24}
                color={cardMuted}
                style={{ letterSpacing: 3.5, marginBottom: 12 }}
              >
                IMPRESSÕES
              </T>
              <T face="italic" size={34} color={cardInk} lines={4} style={{ lineHeight: 46 }}>
                “{d.reviewExcerpt}”
              </T>
            </View>
          )
        )}

        <CardFooter
          username={
            data.username && d?.yearRank?.target
              ? `${data.username} · ${d.yearRank.index}/${d.yearRank.target}`
              : data.username
          }
          palette={{ ...palette, ink: cardInk, muted: cardMuted } as CardPalette}
          style={{ marginTop: "auto" }}
        />
      </View>
    </View>
  );
}

function FichaRow({
  label,
  muted,
  border,
  children,
}: {
  label: string;
  muted: string;
  border: string;
  children: ReactNode;
}) {
  return (
    <View style={[styles.row, { borderBottomColor: border }]}>
      <T face="mono" size={25} color={muted} style={{ letterSpacing: 3 }}>
        {label.toUpperCase()}
      </T>
      <View style={styles.rowRight}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: 1080, height: 1920, padding: 54 },
  card: {
    flex: 1,
    borderRadius: 18,
    paddingTop: 54,
    paddingHorizontal: 48,
    paddingBottom: 46,
    transform: [{ rotate: "-0.8deg" }],
  },
  stamp: {
    position: "absolute",
    top: 44,
    right: 44,
    width: 156,
    height: 156,
    borderRadius: 78,
    borderWidth: 5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "11deg" }],
  },
  stampText: { letterSpacing: 2, lineHeight: 28 },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 34,
    marginTop: 32,
    paddingRight: 150,
  },
  flex: { flex: 1 },
  rule: { borderTopWidth: 3, opacity: 0.2, marginTop: 34, marginBottom: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
    paddingVertical: 18,
    borderBottomWidth: 2,
  },
  rowRight: { alignItems: "flex-end" },
  trailItem: { flexDirection: "row", alignItems: "center", gap: 18 },
  dot: { width: 18, height: 18, borderRadius: 9 },
});
