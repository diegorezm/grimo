import { isDarkColor } from "@grimo/core";
import { CardCover, CardFooter } from "../parts";
import { buildDetailPills, type FinishedCardProps, RatingRow } from "./shared";

/** Minimalist poster centered on a large cover with a warm aura and crisp detail pills. */
export function CartazFinishedCard({ data, palette, showDetails = true }: FinishedCardProps) {
  const dark = isDarkColor(palette.bg);
  const d = data.details;
  const accentText = dark ? palette.accent2 : palette.accent;
  const pills = buildDetailPills(data, showDetails);

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{
        color: palette.ink,
        padding: "82px 72px 68px",
        background: `linear-gradient(180deg, ${palette.paper} 0%, ${palette.bg} 62%)`,
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="font-mono"
          style={{ fontSize: 28, letterSpacing: "0.24em", color: palette.muted }}
        >
          {d?.finishedMonth ? `CONCLUÍDO · ${d.finishedMonth}` : data.eyebrow}
        </span>
        <RatingRow rating={data.book.rating} color={accentText} muted={palette.muted} size={32} />
      </div>

      <div className="relative flex flex-1 items-center justify-center">
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 680,
            height: 680,
            borderRadius: 999,
            background: palette.accent,
            filter: "blur(120px)",
            opacity: dark ? 0.42 : 0.28,
          }}
        />
        <div className="relative">
          <CardCover book={data.book} width={440} palette={palette} />
        </div>
      </div>

      <div
        style={{
          borderRadius: 34,
          padding: "42px 44px 38px",
          background: `${palette.paper}E6`,
          border: `2px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
        }}
      >
        <h1
          className="font-serif"
          style={{
            fontSize: data.book.title.length > 34 ? 52 : 64,
            lineHeight: 1.08,
            fontStyle: "italic",
            fontWeight: 700,
          }}
        >
          {data.book.title}
        </h1>
        <p style={{ fontSize: 34, marginTop: 10, color: accentText }}>
          {[data.book.authors.join(", "), showDetails ? d?.periodRange : null]
            .filter(Boolean)
            .join(" · ")}
        </p>

        {pills.length > 0 && (
          <div className="flex flex-wrap" style={{ gap: 14, marginTop: 26 }}>
            {pills.map((pill) => (
              <span
                key={pill.label}
                className="font-mono"
                style={{
                  fontSize: 25,
                  padding: "8px 20px",
                  borderRadius: 12,
                  background: pill.accent ? palette.accent : palette.bg,
                  color: pill.accent ? (dark ? palette.bg : "#FFFFFF") : palette.ink,
                  fontWeight: pill.accent ? 700 : 500,
                  letterSpacing: "0.06em",
                }}
              >
                {pill.label}
              </span>
            ))}
          </div>
        )}

        <div style={{ marginTop: 34 }}>
          <CardFooter
            username={
              data.username && showDetails && d?.yearRank
                ? `${data.username} · #${d.yearRank.index} DE ${d.yearRank.year}`
                : data.username
            }
            palette={palette}
          />
        </div>
      </div>
    </div>
  );
}
