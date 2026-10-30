import { type BookStoryData, quoteFontSize } from "@grimo/core";
import type { CardPalette } from "@grimo/tokens";
import { CardCover, CardFooter, CardSparkle } from "./parts";

/**
 * The Stories card of one book (1080×1920): "Terminei de ler" with the cover, stars and how long
 * it took, or a quote in big serif with its page and the book under it.
 */
export function BookStoryCard({ data, palette }: { data: BookStoryData; palette: CardPalette }) {
  const rating = data.book.rating ?? 0;
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
      <p
        className="font-mono"
        style={{ fontSize: 34, letterSpacing: "0.3em", color: palette.muted }}
      >
        {data.eyebrow}
      </p>

      {data.quote ? (
        <>
          <p
            className="font-serif"
            style={{ fontSize: 260, lineHeight: 0.8, color: palette.accent, marginTop: 90 }}
          >
            “
          </p>
          <p
            className="font-serif"
            style={{
              fontSize: quoteFontSize(data.quote.body),
              lineHeight: 1.2,
              fontStyle: "italic",
              whiteSpace: "pre-line",
            }}
          >
            {data.quote.body}
          </p>
          {data.quote.page && (
            <p
              className="font-mono"
              style={{ fontSize: 36, marginTop: 40, color: palette.muted, letterSpacing: "0.1em" }}
            >
              P. {data.quote.page}
            </p>
          )}
          <div
            className="flex items-center"
            style={{ gap: 40, marginTop: "auto", marginBottom: 70 }}
          >
            <CardCover book={data.book} width={150} palette={palette} />
            <div style={{ minWidth: 0 }}>
              <p
                className="font-serif"
                style={{ fontSize: 48, lineHeight: 1.1, fontStyle: "italic", fontWeight: 500 }}
              >
                {data.book.title}
              </p>
              <p style={{ fontSize: 34, marginTop: 10, color: palette.accent }}>
                {data.book.authors.join(", ")}
              </p>
            </div>
          </div>
        </>
      ) : (
        <>
          <h1
            className="font-serif"
            style={{ fontSize: 132, lineHeight: 1, fontStyle: "italic", marginTop: 30 }}
          >
            {data.headline}
          </h1>
          <CardCover book={data.book} width={480} palette={palette} style={{ marginTop: 90 }} />
          <p
            className="font-serif"
            style={{
              fontSize: 72,
              lineHeight: 1.1,
              fontStyle: "italic",
              fontWeight: 500,
              marginTop: 70,
            }}
          >
            {data.book.title}
          </p>
          <p style={{ fontSize: 40, marginTop: 16, color: palette.accent }}>
            {data.book.authors.join(", ")}
          </p>
          {rating > 0 && (
            <p style={{ fontSize: 80, marginTop: 40, letterSpacing: "0.1em" }}>
              <span style={{ color: palette.accent2 }}>{"★".repeat(rating)}</span>
              <span style={{ color: palette.paper }}>{"★".repeat(5 - rating)}</span>
            </p>
          )}
          {data.summary && (
            <p
              className="font-mono"
              style={{
                marginTop: "auto",
                marginBottom: 60,
                fontSize: 40,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              {data.summary}
            </p>
          )}
        </>
      )}
      <CardFooter
        username={data.username}
        palette={palette}
        style={data.summary || data.quote ? undefined : { marginTop: "auto" }}
      />
    </div>
  );
}
