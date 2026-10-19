import { CardCover, CardFooter, CardSparkle, Delta } from "../parts";
import type { CardProps } from "../types";

/** Soft journal page: glows, sparkles, serif italics and the favorite cover. */
export function DiarioCard({ data, palette, showCover, showDeltas }: CardProps) {
  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{
        color: palette.ink,
        padding: "120px 96px 96px",
        background: `radial-gradient(900px 700px at 100% 0%, ${palette.accent2}55, transparent 70%), radial-gradient(900px 700px at 0% 100%, ${palette.accent}55, transparent 70%), ${palette.bg}`,
      }}
    >
      <CardSparkle
        size={110}
        color={palette.accent2}
        style={{ position: "absolute", top: 130, right: 110 }}
      />
      <CardSparkle
        size={50}
        color={palette.accent}
        style={{ position: "absolute", top: 330, right: 260 }}
      />
      <CardSparkle
        size={40}
        color={palette.accent2}
        style={{ position: "absolute", bottom: 420, left: 70 }}
      />

      <p
        className="font-mono"
        style={{ fontSize: 34, letterSpacing: "0.25em", color: palette.muted }}
      >
        MEU MÊS DE LEITURA
      </p>
      <h1
        className="font-serif"
        style={{
          fontSize: 132,
          fontStyle: "italic",
          fontWeight: 500,
          lineHeight: 1.05,
          marginTop: 24,
        }}
      >
        <span style={{ textTransform: "capitalize" }}>{data.monthName}</span>
        <br />
        <span style={{ color: palette.muted }}>{data.year}</span>
      </h1>

      <div className="flex items-center" style={{ gap: 70, marginTop: 110 }}>
        {showCover && data.favorite && (
          <CardCover
            book={data.favorite}
            width={330}
            palette={palette}
            style={{ transform: "rotate(-3deg)" }}
          />
        )}
        <div className="flex flex-col" style={{ gap: 50 }}>
          <Stat value={data.booksRead} label="livros" color={palette.accent} muted={palette.muted}>
            {showDeltas && (
              <Delta value={data.deltas.books} against={data.previousShort} palette={palette} />
            )}
          </Stat>
          <Stat
            value={data.pagesRead.toLocaleString("pt-BR")}
            label="páginas"
            color={palette.accent}
            muted={palette.muted}
          >
            {showDeltas && (
              <Delta value={data.deltas.pages} against={data.previousShort} palette={palette} />
            )}
          </Stat>
        </div>
      </div>

      <div
        className="grid grid-cols-2"
        style={{
          gap: 40,
          marginTop: 100,
          padding: "50px 56px",
          borderRadius: 40,
          background: palette.paper,
        }}
      >
        <Stat
          value={data.genre ?? "—"}
          label="gênero mais lido"
          color={palette.ink}
          muted={palette.muted}
          small
        />
        <Stat
          value={data.goal ? `${data.goal.percent}%` : "—"}
          label={data.goal ? `da meta de ${data.goal.target}` : "sem meta"}
          color={palette.ink}
          muted={palette.muted}
          small
        />
        {data.favorite && (
          <p
            className="font-serif"
            style={{ gridColumn: "span 2", fontSize: 44, fontStyle: "italic" }}
          >
            <span
              className="font-mono"
              style={{
                fontSize: 28,
                fontStyle: "normal",
                color: palette.muted,
                letterSpacing: "0.15em",
              }}
            >
              FAVORITO ·{" "}
            </span>
            {data.favorite.title}
          </p>
        )}
      </div>

      <CardFooter username={data.username} palette={palette} style={{ marginTop: "auto" }} />
    </div>
  );
}

function Stat({
  value,
  label,
  color,
  muted,
  small,
  children,
}: {
  value: string | number;
  label: string;
  color: string;
  muted: string;
  small?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <p
        className="font-serif"
        style={{ fontSize: small ? 72 : 150, fontWeight: 500, lineHeight: 1, color }}
      >
        {value}
      </p>
      <p
        className="font-mono"
        style={{ fontSize: 30, letterSpacing: "0.15em", color: muted, marginTop: 10 }}
      >
        {label.toUpperCase()}
      </p>
      {children}
    </div>
  );
}
