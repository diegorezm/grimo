import { isDarkColor } from "@grimo/core";
import { CardCover, CardFooter } from "../parts";
import { type FinishedCardProps, RatingRow } from "./shared";

/** Editorial journal page: review excerpt, feelings, pages, dates and reading pace. */
export function DiarioFinishedCard({ data, palette, showDetails = true }: FinishedCardProps) {
  const dark = isDarkColor(palette.bg);
  const d = data.details;
  const accentText = dark ? palette.accent2 : palette.accent;

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{
        color: palette.ink,
        padding: "86px 76px 72px",
        background: `radial-gradient(780px 620px at 100% 0%, ${palette.accent2}3D, transparent 70%), radial-gradient(780px 620px at 0% 100%, ${palette.accent}35, transparent 70%), ${palette.bg}`,
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="font-mono"
          style={{ fontSize: 28, letterSpacing: "0.24em", color: palette.muted }}
        >
          {data.eyebrow}
        </span>
        {showDetails && d?.yearRank && (
          <span
            className="font-mono"
            style={{
              fontSize: 26,
              letterSpacing: "0.1em",
              padding: "8px 22px",
              borderRadius: 999,
              border: `2px solid ${palette.accent}`,
              color: accentText,
            }}
          >
            #{d.yearRank.index} DE {d.yearRank.year}
          </span>
        )}
      </div>

      <h1
        className="font-serif"
        style={{ fontSize: 92, lineHeight: 1.02, fontStyle: "italic", marginTop: 32 }}
      >
        {data.headline}
      </h1>

      <div className="flex items-center" style={{ gap: 44, marginTop: 48 }}>
        <CardCover book={data.book} width={230} palette={palette} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            className="font-serif"
            style={{
              fontSize: data.book.title.length > 34 ? 46 : 56,
              lineHeight: 1.12,
              fontStyle: "italic",
              fontWeight: 600,
            }}
          >
            {data.book.title}
          </p>
          <p style={{ fontSize: 34, marginTop: 10, color: accentText }}>
            {data.book.authors.join(", ")}
          </p>
          <div style={{ marginTop: 22 }}>
            <RatingRow
              rating={data.book.rating}
              color={accentText}
              muted={palette.muted}
              size={38}
            />
          </div>
        </div>
      </div>

      {showDetails && d?.reviewExcerpt ? (
        <div
          style={{
            marginTop: 48,
            padding: "32px 36px",
            borderRadius: 24,
            background: palette.paper,
            borderLeft: `8px solid ${palette.accent}`,
          }}
        >
          <p
            className="font-serif"
            style={{ fontSize: 36, lineHeight: 1.4, fontStyle: "italic", color: palette.ink }}
          >
            “{d.reviewExcerpt}”
          </p>
        </div>
      ) : (
        showDetails &&
        (d?.genre || d?.publishedYear) && (
          <p
            className="font-mono"
            style={{
              marginTop: 48,
              fontSize: 28,
              letterSpacing: "0.14em",
              color: palette.muted,
              textTransform: "uppercase",
            }}
          >
            {[d.genre, d.publishedYear].filter(Boolean).join(" · ")}
          </p>
        )
      )}

      {showDetails && d && d.feelings.length > 0 && (
        <div className="flex flex-wrap" style={{ gap: 16, marginTop: 36 }}>
          {d.feelings.map((feeling) => (
            <span
              key={feeling}
              className="font-mono"
              style={{
                fontSize: 27,
                letterSpacing: "0.06em",
                padding: "10px 24px",
                borderRadius: 999,
                background: palette.paper,
                color: palette.ink,
              }}
            >
              {feeling}
            </span>
          ))}
        </div>
      )}

      {d && (d.pages || d.days !== null) && (
        <div
          className="grid grid-cols-3"
          style={{
            gap: 24,
            marginTop: 48,
            paddingTop: 36,
            borderTop: `2px solid ${palette.paper}`,
          }}
        >
          <div>
            <p style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.1 }}>{d.pages ?? "—"}</p>
            <p
              className="font-mono"
              style={{ fontSize: 24, letterSpacing: "0.1em", color: palette.muted, marginTop: 8 }}
            >
              PÁGINAS
            </p>
          </div>
          <div>
            <p style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.1 }}>
              {d.days !== null ? `${d.days} ${d.days === 1 ? "dia" : "dias"}` : "—"}
            </p>
            <p
              className="font-mono"
              style={{ fontSize: 22, letterSpacing: "0.08em", color: palette.muted, marginTop: 8 }}
            >
              {d.periodRange ? d.periodRange.toUpperCase() : "DURAÇÃO"}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.1 }}>
              {d.pagesPerDay ? `${d.pagesPerDay}/dia` : (d.finishedMonth ?? "—")}
            </p>
            <p
              className="font-mono"
              style={{ fontSize: 24, letterSpacing: "0.1em", color: palette.muted, marginTop: 8 }}
            >
              {d?.pagesPerDay ? "RITMO" : "CONCLUÍDO"}
            </p>
          </div>
        </div>
      )}

      <CardFooter username={data.username} palette={palette} style={{ marginTop: "auto" }} />
    </div>
  );
}
