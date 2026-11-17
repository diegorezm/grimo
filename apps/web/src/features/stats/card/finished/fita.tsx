import { isDarkColor } from "@grimo/core";
import { CardCover, CardFooter } from "../parts";
import { type FinishedCardProps, RatingRow } from "./shared";

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
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ background: palette.bg, color: palette.ink, padding: "88px 72px 72px" }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 1080 1920"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        {[-55, -28].map((offset) => (
          <path
            key={offset}
            d="M -120 560 C 270 300 840 210 960 540 S 510 960 780 1170 S 1230 1290 1170 1500"
            transform={`translate(${offset} ${offset})`}
            fill="none"
            stroke={palette.accent2}
            strokeOpacity={0.35}
            strokeWidth={5}
          />
        ))}
        <path
          d="M -120 560 C 270 300 840 210 960 540 S 510 960 780 1170 S 1230 1290 1170 1500"
          fill="none"
          stroke={palette.accent}
          strokeWidth={140}
          strokeLinecap="round"
        />
      </svg>

      <div className="relative flex flex-col items-center text-center" style={{ gap: 14 }}>
        <span
          className="font-mono"
          style={{ fontSize: 30, letterSpacing: "0.28em", color: palette.muted }}
        >
          {data.eyebrow}
        </span>
        <span
          style={{
            background: palette.bg,
            padding: "8px 30px",
            fontSize: 82,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          TERMINEI
        </span>
        {pillParts.length > 0 && (
          <span
            className="font-mono"
            style={{
              marginTop: 10,
              padding: "10px 28px",
              borderRadius: 999,
              border: `3px solid ${palette.ink}`,
              fontSize: 28,
              letterSpacing: "0.14em",
              background: palette.bg,
            }}
          >
            {pillParts.join(" · ")}
          </span>
        )}
      </div>

      <div className="relative grid place-items-center" style={{ marginTop: 48 }}>
        <CardCover
          book={data.book}
          width={330}
          palette={palette}
          style={{ transform: "rotate(-4deg)", border: `12px solid ${palette.paper}` }}
        />
      </div>

      <div className="relative flex flex-col items-center text-center" style={{ marginTop: 38 }}>
        <span
          className="font-serif"
          style={{
            background: palette.bg,
            padding: "6px 26px",
            borderRadius: 14,
            fontSize: data.book.title.length > 32 ? 46 : 58,
            fontStyle: "italic",
            fontWeight: 700,
            lineHeight: 1.12,
          }}
        >
          {data.book.title}
        </span>
        <span
          style={{
            background: palette.bg,
            padding: "4px 20px",
            borderRadius: 10,
            marginTop: 10,
            fontSize: 32,
            color: accentText,
          }}
        >
          {[data.book.authors.join(", "), showDetails ? d?.publishedYear : null]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </div>

      <div
        className="relative grid grid-cols-2"
        style={{
          columnGap: 42,
          rowGap: 30,
          marginTop: "auto",
          marginBottom: 42,
          padding: "32px 36px",
          borderRadius: 28,
          background: `${palette.paper}EA`,
        }}
      >
        <div>
          <p
            className="font-mono"
            style={{ fontSize: 24, letterSpacing: "0.12em", color: palette.muted }}
          >
            NOTA
          </p>
          <div style={{ marginTop: 10 }}>
            {data.book.rating ? (
              <RatingRow
                rating={data.book.rating}
                color={accentText}
                muted={palette.muted}
                size={34}
              />
            ) : (
              <p style={{ fontSize: 44, fontWeight: 800 }}>—</p>
            )}
          </div>
        </div>
        <div>
          <p
            className="font-mono"
            style={{ fontSize: 24, letterSpacing: "0.12em", color: palette.muted }}
          >
            EXTENSÃO
          </p>
          <p style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.15, marginTop: 6 }}>
            {d?.pages ? `${d.pages} pág` : "—"}
          </p>
        </div>
        <div>
          <p
            className="font-mono"
            style={{ fontSize: 24, letterSpacing: "0.12em", color: palette.muted }}
          >
            {showDetails && d?.genre ? "GÊNERO" : "CONCLUÍDO"}
          </p>
          <p style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.15, marginTop: 6 }}>
            {(showDetails && d?.genre) || d?.finishedMonth || "—"}
          </p>
        </div>
        <div>
          <p
            className="font-mono"
            style={{ fontSize: 24, letterSpacing: "0.12em", color: palette.muted }}
          >
            {d?.yearRank ? `META ${d.yearRank.year}` : "SENSAÇÃO"}
          </p>
          <p
            style={{
              fontSize: 48,
              fontWeight: 800,
              lineHeight: 1.15,
              marginTop: 6,
              color: accentText,
            }}
          >
            {d?.yearRank
              ? d.yearRank.target
                ? `${d.yearRank.index} / ${d.yearRank.target}`
                : `#${d.yearRank.index}`
              : (d?.feelings[0] ?? "—")}
          </p>
        </div>
      </div>

      <div className="relative">
        <CardFooter username={data.username} palette={palette} />
      </div>
    </div>
  );
}
