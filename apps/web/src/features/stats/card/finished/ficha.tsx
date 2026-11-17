import { isDarkColor } from "@grimo/core";
import type { CardPalette } from "@grimo/tokens";
import { CardCover, CardFooter } from "../parts";
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
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ background: palette.bg, padding: 54 }}
    >
      <div
        className="relative flex flex-1 flex-col"
        style={{
          background: cardBg,
          color: cardInk,
          borderRadius: 18,
          padding: "54px 48px 46px",
          transform: "rotate(-0.8deg)",
          boxShadow: "0 42px 84px rgba(0,0,0,0.34)",
        }}
      >
        {/* Library stamp */}
        <div
          className="font-mono flex flex-col items-center justify-center text-center"
          style={{
            position: "absolute",
            top: 44,
            right: 44,
            width: 156,
            height: 156,
            borderRadius: 999,
            border: `5px dashed ${cardAccent}`,
            color: cardAccent,
            transform: "rotate(11deg)",
            fontSize: 23,
            fontWeight: 700,
            letterSpacing: "0.08em",
            lineHeight: 1.2,
          }}
        >
          <span>LIDO</span>
          {d?.finishedStamp && <span>{d.finishedStamp}</span>}
        </div>

        <span
          className="font-mono"
          style={{ fontSize: 26, letterSpacing: "0.22em", color: cardMuted }}
        >
          {d?.yearRank ? `FICHA DE LEITURA · Nº ${d.yearRank.index}` : "FICHA DE LEITURA"}
        </span>

        <div className="flex items-center" style={{ gap: 34, marginTop: 32, paddingRight: 150 }}>
          <CardCover book={data.book} width={164} palette={palette} />
          <div style={{ minWidth: 0 }}>
            <h1
              className="font-serif"
              style={{
                fontSize: data.book.title.length > 32 ? 44 : 52,
                lineHeight: 1.12,
                fontStyle: "italic",
                fontWeight: 700,
              }}
            >
              {data.book.title}
            </h1>
            <p style={{ fontSize: 32, color: cardMuted, marginTop: 10 }}>
              {data.book.authors.join(", ")}
            </p>
            {(d?.genre || d?.publishedYear) && (
              <p
                className="font-mono"
                style={{
                  fontSize: 26,
                  color: cardAccent,
                  marginTop: 10,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {[d?.genre, d?.publishedYear].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>

        <div style={{ borderTop: `3px solid ${cardInk}`, opacity: 0.2, margin: "34px 0 10px" }} />

        <FichaRow label="Avaliação" muted={cardMuted} border={lineBorder}>
          {data.book.rating ? (
            <RatingRow rating={data.book.rating} color={cardAccent} muted={cardMuted} size={32} />
          ) : (
            <span>Sem nota</span>
          )}
        </FichaRow>
        <FichaRow label="Período" muted={cardMuted} border={lineBorder}>
          <span>{periodText}</span>
        </FichaRow>
        {editionParts.length > 0 && (
          <FichaRow label="Edição" muted={cardMuted} border={lineBorder}>
            <span>{editionParts.join(" · ")}</span>
          </FichaRow>
        )}
        {showDetails && d && d.feelings.length > 0 && (
          <FichaRow label="Sensações" muted={cardMuted} border={lineBorder}>
            <span>{d.feelings.join(", ")}</span>
          </FichaRow>
        )}
        {showDetails && d && d.rereadCount > 0 && (
          <FichaRow label="Releitura" muted={cardMuted} border={lineBorder}>
            <span>{d.rereadCount + 1}ª leitura</span>
          </FichaRow>
        )}

        {showDetails && d && d.diaryMarks.length > 0 ? (
          <div style={{ marginTop: 32 }}>
            <p
              className="font-mono"
              style={{
                fontSize: 24,
                letterSpacing: "0.14em",
                color: cardMuted,
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              Trilha do diário
            </p>
            <div className="flex flex-col" style={{ gap: 14 }}>
              {d.diaryMarks.map((mark, index) => (
                <div
                  key={`${mark.page}-${index}`}
                  className="flex items-center"
                  style={{ gap: 18 }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 999,
                      background: index % 2 === 0 ? palette.accent : palette.accent2,
                      flexShrink: 0,
                    }}
                  />
                  <span className="font-mono" style={{ fontSize: 27, color: cardMuted }}>
                    p. {mark.page}
                  </span>
                  <span style={{ fontSize: 30, fontWeight: 500 }}>{mark.feelings.join(" · ")}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          showDetails &&
          d?.reviewExcerpt && (
            <div style={{ marginTop: 32 }}>
              <p
                className="font-mono"
                style={{
                  fontSize: 24,
                  letterSpacing: "0.14em",
                  color: cardMuted,
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                Impressões
              </p>
              <p
                className="font-serif"
                style={{ fontSize: 34, lineHeight: 1.35, fontStyle: "italic" }}
              >
                “{d.reviewExcerpt}”
              </p>
            </div>
          )
        )}

        <div style={{ marginTop: "auto" }}>
          <CardFooter
            username={
              data.username && d?.yearRank?.target
                ? `${data.username} · ${d.yearRank.index}/${d.yearRank.target}`
                : data.username
            }
            palette={{ ...palette, ink: cardInk, muted: cardMuted } as CardPalette}
          />
        </div>
      </div>
    </div>
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
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-baseline justify-between"
      style={{ gap: 24, padding: "18px 0", borderBottom: `2px solid ${border}`, fontSize: 31 }}
    >
      <span
        className="font-mono"
        style={{ fontSize: 25, letterSpacing: "0.12em", color: muted, textTransform: "uppercase" }}
      >
        {label}
      </span>
      <div style={{ fontWeight: 600, textAlign: "right" }}>{children}</div>
    </div>
  );
}
