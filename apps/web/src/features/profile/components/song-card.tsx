import { musicServiceColors } from "@grimo/tokens";

export interface SongCardData {
  title: string;
  artist: string;
  url: string;
  service: string | null;
  /** Our stored copy (or, while editing, the preview's data URL). Never the service's own. */
  coverUrl: string | null;
  /** Card background taken from the cover. */
  color: string | null;
}

/**
 * "Trilha da leitura": a slim strip in the cover's color with the cover, the song and the
 * artist. Clicking opens the song in its own service (nothing plays or loads here). `onRemove`
 * (editing): a "Tirar" button in place of play, and the card is not a link.
 */
export function SongCard({ song, onRemove }: { song: SongCardData; onRemove?: () => void }) {
  const listen = song.service ? `Ouvir no ${song.service}` : "Ouvir";
  const body = (
    <>
      {song.coverUrl ? (
        <img src={song.coverUrl} alt="" className="size-11 shrink-0 rounded-md object-cover" />
      ) : (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-md border border-current text-xl opacity-60">
          ♪
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-bold">
          {song.title}
          <span className="font-normal opacity-85"> · {song.artist}</span>
        </span>
        <span className="flex items-center gap-1.5 truncate text-xs opacity-80">
          {song.service && (
            <span
              className="size-2 shrink-0 rounded-full bg-accent"
              style={{ background: musicServiceColors[song.service] }}
            />
          )}
          Trilha da leitura · {listen}
        </span>
      </span>
    </>
  );
  const className =
    "flex items-center gap-3 rounded-2xl py-2 pr-3 pl-2 text-inverse-foreground bg-inverse";
  const style = song.color ? { background: song.color } : undefined;

  if (onRemove) {
    return (
      <div className={className} style={style}>
        {body}
        <button
          type="button"
          onClick={onRemove}
          className="px-2 py-2 font-mono text-xs tracking-wider uppercase hover:opacity-70"
        >
          Tirar
        </button>
      </div>
    );
  }
  return (
    <a
      href={song.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Trilha da leitura: ${song.title}, de ${song.artist}. ${listen}`}
      className={`${className} transition hover:opacity-90`}
      style={style}
    >
      {body}
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-inverse-foreground">
        <svg viewBox="0 0 24 24" className="size-3" aria-hidden="true">
          <path d="M7 4v16l13-8z" fill={song.color ?? "var(--color-inverse)"} />
        </svg>
      </span>
    </a>
  );
}
