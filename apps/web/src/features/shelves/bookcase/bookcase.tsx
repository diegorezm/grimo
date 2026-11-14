import { type BookcasePiece, coverUrl, layoutBookcase, type ShelfStyle } from "@grimo/core";
import { shelfBrass } from "@grimo/tokens";
import { useSearch } from "@tanstack/react-router";
import {
  type CSSProperties,
  type ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BookPeekLink } from "@/features/books";
import { cn } from "@/utils/cn";
import { ArtSvg } from "./art";
import { ArchIvy, LibraryLadder, LibraryLamp, PlankBracket, ShelfDecorArt } from "./decor";
import {
  bindingOf,
  crownArtOf,
  GLOSS,
  GLOSS_LYING,
  LINEN,
  type Material,
  materialOf,
  modelLook,
  modelOver,
  spineColor,
  spineInk,
} from "./look";

/** What a book on the bookcase needs: your own shelf rows and a profile's shelf both fit. */
export interface ShelfBookItem {
  entry: { id: string };
  book: {
    title: string;
    authors?: string[];
    coverUrl: string | null;
    openLibraryId: string;
    pageCount?: number | null;
  };
}

type Row<T> = { key: string; title: string; pageCount?: number | null; item: T };

/** Bigger screens, bigger books: a wide bookcase shouldn't hold a row of matchsticks. */
const scaleFor = (width: number) => (width >= 1100 ? 1.3 : width >= 760 ? 1.15 : 1);

/** Width and window height, kept up to date (0 until measured). */
function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  const [viewport, setViewport] = useState(() =>
    typeof window === "undefined" ? 800 : window.innerHeight,
  );
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const observer = new ResizeObserver(([entry]) => setWidth(entry!.contentRect.width));
    observer.observe(el);
    const onResize = () => setViewport(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);
  return [ref, width, viewport] as const;
}

/**
 * A reader's shelf as a piece of furniture (the web twin of mobile's `Bookcase`): the model,
 * painted in the chosen material, books laid out by `layoutBookcase` (`@grimo/core`, the same on
 * the phone) as cover edges, tones, linen or leather, piles or covers, objects between them and
 * the light over it all. It fills its column; `fill` makes it reach the bottom of the window.
 * A book opens in the side peek (the open one is pulled out, showing its whole cover); in select
 * mode, clicking picks it.
 */
export function Bookcase<T extends ShelfBookItem>({
  items,
  style,
  name,
  fill = false,
  selecting = false,
  selected = [],
  onPick,
  empty,
}: {
  items: readonly T[];
  style: ShelfStyle;
  /** On the brass plaque at the foot of the furniture. */
  name: string;
  /** At least as tall as the window (the shelves screen). */
  fill?: boolean;
  selecting?: boolean;
  selected?: readonly string[];
  /** Select mode: a book was clicked. */
  onPick?: (item: T) => void;
  /** Shown on the first shelf when it is empty. */
  empty?: ReactNode;
}) {
  const { book: openBook } = useSearch({ strict: false }) as { book?: string };
  const [ref, width, viewport] = useSize<HTMLDivElement>();
  const scale = scaleFor(width);
  const inner = width / scale;
  const look = modelLook(style, inner);
  const material = materialOf(style);
  const crownArt = crownArtOf(style);
  const over = modelOver(style, inner);
  const minRows = fill
    ? Math.max(3, Math.floor((viewport / scale - 330) / (style.layout === "covers" ? 150 : 210)))
    : 1;
  const layout = useMemo(
    () =>
      layoutBookcase<Row<T>>(
        items.map((item) => ({
          key: item.entry.id,
          title: item.book.title,
          pageCount: item.book.pageCount,
          item,
        })),
        style,
        inner,
        minRows,
      ),
    [items, style, inner, minRows],
  );
  const { geometry, rowHeight } = layout;
  // Changing how the books stand drops them onto the planks again.
  const landKey = `${style.model}-${style.layout}-${style.sort}`;
  let order = 0;

  const piece = (p: BookcasePiece<Row<T>>) => (
    <div
      key={p.key}
      className={cn("flex items-end", order % 2 ? "shelf-land-b" : "shelf-land-a")}
      style={{
        animationDelay: `${Math.min(order++, 40) * 0.03}s`,
        margin:
          p.kind === "book"
            ? p.lean
              ? "0 1px 0 10px"
              : "0 1px"
            : p.kind === "cover"
              ? "0 4px"
              : "0 6px",
        filter:
          style.light === "lamp" ? "drop-shadow(0 -2px 6px rgba(255,200,110,.25))" : undefined,
      }}
    >
      <Piece
        piece={p}
        material={material}
        style={style}
        openBook={openBook}
        selecting={selecting}
        selected={selected}
        onPick={onPick}
      />
    </div>
  );

  return (
    <div ref={ref} className={cn("relative flex min-w-0 flex-col", fill && "flex-1")}>
      {width > 0 && (
        <div
          className="relative flex flex-1 flex-col"
          style={{ ...look.frame, zoom: scale } as CSSProperties}
        >
          <div className="relative shrink-0" style={look.crown}>
            {style.model === "library" && <LibraryLamp />}
            {crownArt && (
              <ArtSvg art={crownArt} stretch className="absolute inset-x-0 bottom-0 block" />
            )}
          </div>
          {style.model === "arch" && <ArchIvy />}

          <div key={landKey} className="relative flex flex-1 flex-col" style={look.inner}>
            {layout.rows.map((row, r) => (
              <div key={r} className="flex" style={{ gap: geometry.gap }}>
                {row.map((cell, c) => (
                  <div key={c} className="relative min-w-0 flex-1" style={look.cell}>
                    <div
                      className="relative flex items-end"
                      style={{
                        height: rowHeight,
                        ...look.row,
                        ...(look.rowLight && { backgroundImage: look.rowLight }),
                      }}
                    >
                      {cell.map(piece)}
                      {empty && r === 0 && c === 0 && cell.every((p) => p.kind === "decor") && (
                        <div
                          className="absolute inset-0 flex items-center justify-center px-4 text-center font-serif text-lg italic"
                          style={{ color: material.ink }}
                        >
                          {empty}
                        </div>
                      )}
                    </div>
                    <div style={look.plankTop} />
                    <div style={look.plank} />
                    {style.model === "floating" && (
                      <>
                        <PlankBracket color={look.bracket} side="left" />
                        <PlankBracket color={look.bracket} side="right" />
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}
            {/* What's left below the last plank: the back panel. */}
            <div className="flex-1" />
            {style.model === "library" && <LibraryLadder />}
            {over && <div className="pointer-events-none absolute inset-0 z-[3]" style={over} />}
          </div>

          <div className="flex h-16 shrink-0 justify-center pt-3.5">
            <span
              className="h-5 max-w-60 truncate rounded-[3px] px-3 font-mono text-[9px] leading-5 font-semibold tracking-[0.16em] uppercase shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_1px_2px_rgba(0,0,0,.25)]"
              style={{
                color: shelfBrass.ink,
                background: `linear-gradient(180deg, ${shelfBrass.light}, ${shelfBrass.base})`,
              }}
            >
              {name}
            </span>
          </div>
          {look.light && (
            <div className="pointer-events-none absolute inset-0 z-[4]" style={look.light} />
          )}
        </div>
      )}
    </div>
  );
}

const FOCUS =
  "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2";

function Piece<T extends ShelfBookItem>({
  piece,
  material,
  style,
  openBook,
  selecting,
  selected,
  onPick,
}: {
  piece: BookcasePiece<Row<T>>;
  material: Material;
  style: ShelfStyle;
  openBook: string | undefined;
  selecting: boolean;
  selected: readonly string[];
  onPick?: (item: T) => void;
}) {
  const { finish } = style;
  if (piece.kind === "decor") return <ShelfDecorArt decor={piece.decor} />;

  const touch = (row: Row<T>, className: string, css: CSSProperties, children: ReactNode) => (
    <BookTouch
      item={row.item}
      open={row.item.book.openLibraryId === openBook}
      selecting={selecting}
      picked={selected.includes(row.item.entry.id)}
      onPick={onPick}
      className={className}
      style={css}
    >
      {children}
    </BookTouch>
  );

  if (piece.kind === "stack") {
    const paint = finish === "cover" ? "tone" : finish;
    return (
      <div className="flex flex-col items-center">
        {piece.books.map(({ book, length, thickness, tone, shift }) => (
          <div key={book.key} style={{ transform: `translateX(${shift}px)` }}>
            {touch(
              book,
              "flex items-center overflow-hidden rounded-[1px_2px_2px_1px] px-2",
              {
                width: length,
                height: thickness,
                background: `${GLOSS_LYING}${paint === "linen" ? `, ${LINEN}` : ""}, ${spineColor(material, tone, paint)}`,
                color: spineInk(material, tone, paint),
                boxShadow: "0 1px 0 rgba(0,0,0,.18)",
              },
              <span className="truncate font-serif text-[9.5px] font-semibold">{book.title}</span>,
            )}
          </div>
        ))}
      </div>
    );
  }

  const { book } = piece;
  const cover = book.item.book.coverUrl;

  if (piece.kind === "cover") {
    return touch(
      book,
      "relative flex flex-col justify-end overflow-hidden rounded-[2px_6px_6px_2px] p-2 text-left",
      {
        width: piece.width,
        height: piece.height,
        background: spineColor(material, piece.tone, finish),
        color: spineInk(material, piece.tone, finish),
        boxShadow: "inset 5px 0 0 rgba(0,0,0,.14), 0 6px 12px rgba(0,0,0,.18)",
      },
      cover ? (
        <img
          src={coverUrl(cover, "M")}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <span className="line-clamp-4 font-serif text-xs leading-[1.1]">{book.title}</span>
      ),
    );
  }

  // "Capa do livro": the cover's edge stands on the shelf and opens to the whole cover.
  const showCover = finish === "cover" && Boolean(cover);
  const paint = finish === "cover" ? "tone" : finish;
  const title = (
    <span
      className="max-h-full truncate px-0.5 font-serif leading-none font-semibold [writing-mode:vertical-rl] rotate-180"
      style={{ fontSize: piece.width < 27 ? 10 : 11.5 }}
    >
      {book.title}
    </span>
  );
  const lean = piece.lean ? { transform: "rotate(-9deg)", transformOrigin: "bottom left" } : {};

  if (showCover) {
    return (
      <div style={lean}>
        {touch(
          book,
          "group/spine relative flex w-(--w) justify-center overflow-hidden rounded-[2px_2px_1px_1px] py-2.5 transition-[width] duration-300 hover:w-(--open-w) focus-visible:w-(--open-w) [&.is-open]:w-(--open-w)",
          {
            "--w": `${piece.width}px`,
            "--open-w": `${Math.round(piece.height * 0.66)}px`,
            height: piece.height,
            background: `${GLOSS}, url("${coverUrl(cover!, "M")}") left center / auto 100% no-repeat, ${spineColor(material, piece.tone, "tone")}`,
            boxShadow: "1px 0 0 rgba(0,0,0,.14)",
          } as CSSProperties,
          null,
        )}
      </div>
    );
  }

  return (
    <div style={lean}>
      {touch(
        book,
        "flex justify-center overflow-hidden rounded-[2px_2px_1px_1px] py-2.5",
        {
          width: piece.width,
          height: piece.height,
          background: `${bindingOf(paint)}, ${spineColor(material, piece.tone, paint)}`,
          color: spineInk(material, piece.tone, paint),
          boxShadow: "1px 0 0 rgba(0,0,0,.14)",
        },
        title,
      )}
    </div>
  );
}

/** A book you open (side peek) or, in select mode, pick; the open one is pulled out. */
function BookTouch<T extends ShelfBookItem>({
  item,
  open,
  selecting,
  picked,
  onPick,
  className,
  style,
  children,
}: {
  item: T;
  open: boolean;
  selecting: boolean;
  picked: boolean;
  onPick?: (item: T) => void;
  className: string;
  style: CSSProperties;
  children: ReactNode;
}) {
  const label = [item.book.title, item.book.authors?.join(", ")].filter(Boolean).join(", de ");
  const lifted = picked || open;
  const shared = cn(
    "shelf-spine relative block",
    FOCUS,
    selecting && !picked && "opacity-75",
    open && "is-open",
    className,
  );
  const css: CSSProperties = { ...style, transform: lifted ? "translateY(-14px)" : undefined };
  const check = selecting && (
    <span
      aria-hidden="true"
      className={cn(
        "absolute top-1 left-1/2 flex size-[18px] -translate-x-1/2 items-center justify-center rounded-full border text-[11px] text-accent-foreground",
        picked ? "border-accent bg-accent" : "glass",
      )}
    >
      {picked && "✓"}
    </span>
  );

  if (selecting || !item.book.openLibraryId) {
    return (
      <button
        type="button"
        aria-pressed={selecting ? picked : undefined}
        aria-label={label}
        onClick={() => onPick?.(item)}
        className={shared}
        style={css}
      >
        {children}
        {check}
      </button>
    );
  }
  return (
    <BookPeekLink
      openLibraryId={item.book.openLibraryId}
      aria-label={label}
      className={shared}
      style={css}
    >
      {children}
    </BookPeekLink>
  );
}
