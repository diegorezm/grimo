import { type BookStoryData, type FinishedCardTemplate, quoteFontSize } from "@grimo/core";
import type { CardPalette } from "@grimo/tokens";
import { FINISHED_CARD_COMPONENTS } from "./finished";
import { CardCover, CardFooter } from "./parts";

/**
 * The Stories card of one book (1080×1920): 5 finished-book designs (Cantinho, Diário, Fita,
 * Ficha, Cartaz) or a quote in big serif with its page and the book under it.
 */
export function BookStoryCard({
  data,
  palette,
  template = "cantinho",
  showDetails = true,
}: {
  data: BookStoryData;
  palette: CardPalette;
  template?: FinishedCardTemplate;
  showDetails?: boolean;
}) {
  if (!data.quote) {
    const Finished = FINISHED_CARD_COMPONENTS[template];
    return <Finished data={data} palette={palette} showDetails={showDetails} />;
  }

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ background: palette.bg, color: palette.ink, padding: "110px 90px 90px" }}
    >
      <p
        className="font-mono"
        style={{ fontSize: 34, letterSpacing: "0.3em", color: palette.muted }}
      >
        {data.eyebrow}
      </p>

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
      <div className="flex items-center" style={{ gap: 40, marginTop: "auto", marginBottom: 70 }}>
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

      <CardFooter username={data.username} palette={palette} />
    </div>
  );
}
