import { CardCover, CardFooter, CardSparkle, Delta } from "../parts";
import type { CardProps } from "../types";

/** Bold "year in sport" style: a thick ribbon swooping behind the cover, big stats. */
export function FitaCard({ data, palette, showCover, showDeltas }: CardProps) {
  const stats = [
    { label: "Livros lidos", value: data.booksRead, delta: data.deltas.books },
    { label: "Páginas", value: data.pagesRead.toLocaleString("pt-BR"), delta: data.deltas.pages },
    { label: "Gênero do mês", value: data.genre ?? "—", delta: null },
    {
      label: `Meta de ${data.year}`,
      value: data.goal ? `${data.goal.percent}%` : "—",
      delta: null,
    },
  ];

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ background: palette.bg, color: palette.ink, padding: "110px 90px 90px" }}
    >
      {/* The ribbon, with thin echo lines beside it. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1080 1920"
        className="absolute inset-0"
        style={{ width: 1080, height: 1920 }}
      >
        {[-70, -40].map((offset) => (
          <path
            key={offset}
            d="M -120 520 C 260 260 820 160 960 470 S 520 900 760 1080 S 1240 1180 1200 1400"
            transform={`translate(${offset} ${offset})`}
            fill="none"
            stroke={palette.accent2}
            strokeOpacity={0.35}
            strokeWidth={4}
          />
        ))}
        <path
          d="M -120 520 C 260 260 820 160 960 470 S 520 900 760 1080 S 1240 1180 1200 1400"
          fill="none"
          stroke={palette.accent}
          strokeWidth={150}
          strokeLinecap="round"
        />
      </svg>

      <div className="relative flex flex-col items-center" style={{ gap: 14 }}>
        <span className="font-mono" style={{ fontSize: 34, letterSpacing: "0.3em" }}>
          GRIMO
        </span>
        {["MEU MÊS", "DE LEITURA"].map((line) => (
          <span
            key={line}
            style={{
              background: palette.bg,
              padding: "4px 28px",
              fontSize: 112,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            {line}
          </span>
        ))}
        <span
          className="font-mono"
          style={{
            marginTop: 18,
            padding: "10px 30px",
            borderRadius: 999,
            border: `3px solid ${palette.ink}`,
            fontSize: 34,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            background: palette.bg,
          }}
        >
          {data.monthLabel}
        </span>
      </div>

      <div className="relative grid place-items-center" style={{ height: 640, marginTop: 30 }}>
        {showCover && data.favorite ? (
          <CardCover
            book={data.favorite}
            width={400}
            palette={palette}
            style={{ transform: "rotate(-4deg)", border: `14px solid ${palette.paper}` }}
          />
        ) : (
          <div
            className="flex flex-col items-center"
            style={{ background: palette.bg, padding: 40 }}
          >
            <span style={{ fontSize: 340, fontWeight: 800, lineHeight: 1 }}>{data.booksRead}</span>
            <span className="font-mono" style={{ fontSize: 40, letterSpacing: "0.2em" }}>
              LIVROS
            </span>
          </div>
        )}
        <CardSparkle
          size={90}
          color={palette.accent2}
          style={{ position: "absolute", top: 40, right: 60 }}
        />
      </div>

      <div
        className="relative grid grid-cols-2"
        style={{ columnGap: 60, rowGap: 56, marginTop: "auto", marginBottom: 70 }}
      >
        {stats.map((stat) => (
          <div key={stat.label}>
            <p
              className="font-mono"
              style={{ fontSize: 30, letterSpacing: "0.12em", color: palette.muted }}
            >
              {stat.label.toUpperCase()}
            </p>
            <p style={{ fontSize: 88, fontWeight: 800, lineHeight: 1.1 }}>{stat.value}</p>
            {showDeltas && (
              <Delta value={stat.delta} against={data.previousShort} palette={palette} />
            )}
          </div>
        ))}
      </div>

      <CardFooter username={data.username} palette={palette} />
    </div>
  );
}
