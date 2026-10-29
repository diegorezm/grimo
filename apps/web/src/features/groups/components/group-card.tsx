import type { GroupCardData } from "@grimo/core";
import type { CardPalette } from "@grimo/tokens";
import { CardCover, CardFooter, CardSparkle } from "@/features/stats";

/**
 * The Juntos story card (1080×1920): the book, then each reader's bar. When everyone finished it
 * becomes "Terminamos juntos". Initials instead of photos: the exported image must not depend on
 * other sites allowing it to draw their pictures.
 */
export function GroupCard({ data, palette }: { data: GroupCardData; palette: CardPalette }) {
  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ background: palette.bg, color: palette.ink, padding: "110px 90px 90px" }}
    >
      <CardSparkle
        size={110}
        color={palette.accent2}
        style={{ position: "absolute", top: 120, right: 110 }}
      />
      <CardSparkle
        size={60}
        color={palette.accent}
        style={{ position: "absolute", bottom: 330, right: 90 }}
      />

      <p
        className="font-mono"
        style={{ fontSize: 34, letterSpacing: "0.3em", color: palette.muted }}
      >
        GRIMO · JUNTOS
      </p>
      <h1
        className="font-serif"
        style={{ fontSize: 132, lineHeight: 1, fontStyle: "italic", marginTop: 30 }}
      >
        {data.headline}
      </h1>

      <div className="flex items-end" style={{ gap: 50, marginTop: 70 }}>
        <CardCover book={data.book} width={300} palette={palette} />
        <div style={{ minWidth: 0, paddingBottom: 10 }}>
          <p
            className="font-serif"
            style={{ fontSize: 64, lineHeight: 1.1, fontStyle: "italic", fontWeight: 500 }}
          >
            {data.book.title}
          </p>
          <p style={{ fontSize: 38, marginTop: 16, color: palette.accent }}>
            {data.book.authors.join(", ")}
          </p>
        </div>
      </div>

      <div className="flex flex-col" style={{ gap: 34, marginTop: 90 }}>
        {data.members.map((member) => (
          <div key={member.name} className="flex items-center" style={{ gap: 28 }}>
            <span
              className="grid place-items-center font-serif"
              style={{
                width: 84,
                height: 84,
                borderRadius: 999,
                background: palette.paper,
                fontSize: 44,
                flexShrink: 0,
              }}
            >
              {member.initial}
            </span>
            <span style={{ width: 210, fontSize: 40, fontWeight: 600, flexShrink: 0 }}>
              {member.name}
            </span>
            <span
              style={{
                flex: 1,
                height: 22,
                borderRadius: 999,
                background: palette.paper,
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  display: "block",
                  height: "100%",
                  width: `${member.percent}%`,
                  borderRadius: 999,
                  background: palette.accent,
                }}
              />
            </span>
            <span className="font-mono" style={{ width: 130, fontSize: 36, textAlign: "right" }}>
              {member.percent}%
            </span>
          </div>
        ))}
        {data.more > 0 && (
          <p className="font-mono" style={{ fontSize: 32, color: palette.muted }}>
            + {data.more} {data.more === 1 ? "leitor" : "leitores"}
          </p>
        )}
      </div>

      <p
        className="font-mono"
        style={{
          marginTop: "auto",
          marginBottom: 60,
          fontSize: 40,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: data.finished ? palette.accent : palette.ink,
        }}
      >
        {data.summary}
      </p>
      <CardFooter username={data.username} palette={palette} />
    </div>
  );
}
