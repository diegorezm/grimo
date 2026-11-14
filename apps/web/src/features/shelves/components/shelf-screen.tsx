import {
  type MyShelf,
  type ShelfItem,
  toast,
  useCreateShelf,
  useMoveBooks,
  useMyShelves,
  useRemoveShelf,
  useSetShelfBooks,
  useSetShelfPublic,
  useSetShelfStyle,
  useShelf,
  useShelfScreenStore,
} from "@grimo/client";
import {
  countByShelf,
  DEFAULT_SHELF_STYLE,
  GENRE_LABELS,
  type Genre,
  MAX_BULK_BOOKS,
  matchesShelfFilter,
  SHELF_LABELS,
  SHELF_MATERIAL_LABELS,
  SHELF_MODEL_LABELS,
  SHELF_STATUSES,
  type ShelfStyle,
  sameStyle,
  shelfGenres,
} from "@grimo/core";
import { Link } from "@tanstack/react-router";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Spinner } from "@/components/feedback/spinner";
import {
  BrushIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SlidersIcon,
} from "@/components/ui/icons";
import { MenuItem, Popover } from "@/components/ui/popover";
import { useShelfNaming } from "@/features/books";
import { cn } from "@/utils/cn";
import { Bookcase } from "../bookcase/bookcase";
import { materialOf } from "../bookcase/look";
import { BookcaseThumb } from "../bookcase/thumb";
import { CustomizeActions, CustomizePanel } from "./customize-panel";

/** One page: "Todos os meus livros" (no id) or a shelf you made. */
interface Page {
  id: string | null;
  name: string;
  style: ShelfStyle;
  shelf: MyShelf | null;
  /** Its books, filtered. */
  items: ShelfItem[];
  /** Its books, unfiltered (counts). */
  all: ShelfItem[];
}

const booksLabel = (n: number) => `${n} ${n === 1 ? "livro" : "livros"}`;

/**
 * Estantes: the bookcase is the page (the web twin of mobile's `ShelfBoard`). Its wall covers
 * the whole main column; on it float the shelf picker ("Todos os meus livros" first, then the
 * shelves you made), filters (status, genre), ⋯ and "Personalizar", which opens the editor beside
 * the bookcase so every change shows on the whole piece. Arrows, dots or a swipe change shelf;
 * "Selecionar" picks books to add, move or take off at once.
 */
export function ShelfScreen() {
  const all = useShelf();
  const mine = useMyShelves();
  const shelves = mine.data?.items ?? [];
  const store = useShelfScreenStore();
  const { shelfId, filter, selecting, selected, pickingFor } = store;
  const naming = useShelfNaming();
  const setStyle = useSetShelfStyle();
  const [editing, setEditing] = useState<ShelfStyle | null>(null);
  const [customizeNext, setCustomizeNext] = useState<string | null>(null);
  const swipe = useRef<number | null>(null);

  const rows = all.data?.items ?? [];
  const pages = useMemo<Page[]>(() => {
    const visible = (list: ShelfItem[]) =>
      list.filter((row) => matchesShelfFilter(row, { ...filter, tagIds: [] }));
    const made = shelves.map((shelf) => {
      const on = rows.filter((row) => row.entry.tagIds.includes(shelf.id));
      return {
        id: shelf.id,
        name: shelf.name,
        style: shelf.style,
        shelf,
        items: visible(on),
        all: on,
      };
    });
    return [
      {
        id: null,
        name: "Todos os meus livros",
        style: mine.data?.all.style ?? DEFAULT_SHELF_STYLE,
        shelf: null,
        items: visible(rows),
        all: rows,
      },
      ...made,
    ];
  }, [rows, shelves, filter, mine.data]);
  const index = Math.max(
    0,
    pages.findIndex((page) => page.id === shelfId),
  );
  const page = pages[index]!;
  const style = editing ?? page.style;
  const material = materialOf(style);
  const dark = material.dark;
  const counts = countByShelf(page.all.map(({ entry }) => entry));
  const genres = shelfGenres(page.all);
  const activeFilters = filter.statuses.length + filter.genres.length;
  const picking = shelves.find((shelf) => shelf.id === pickingFor) ?? null;
  const allPicked =
    page.items.length > 0 && page.items.every((row) => selected.includes(row.entry.id));

  // The wall goes behind the app's top bar too (see `AppShell`), and the whole column (top bar,
  // menus, the editor) takes the wall's scheme: a light wall reads light in the app's dark mode.
  useEffect(() => {
    const root = document.documentElement.style;
    const column = document.querySelector<HTMLElement>("[data-app-column]");
    root.setProperty("--shelf-room-wall", material.room);
    column?.setAttribute("data-scheme", material.dark ? "dark" : "light");
    return () => {
      root.removeProperty("--shelf-room-wall");
      column?.removeAttribute("data-scheme");
    };
  }, [material.room, material.dark]);

  // A new shelf opens straight into "Personalizar" once it arrives.
  useEffect(() => {
    if (!customizeNext || page.id !== customizeNext) return;
    setCustomizeNext(null);
    setEditing(page.style);
  }, [customizeNext, page]);

  const go = (step: 1 | -1) => {
    if (selecting || editing || pages.length < 2) return;
    store.openShelf(pages[(index + step + pages.length) % pages.length]!.id);
  };

  function doneEditing() {
    if (editing && !sameStyle(editing, page.style)) {
      setStyle.mutate(
        { id: page.id ?? undefined, style: editing },
        { onError: (error) => toast.failed(error) },
      );
      toast.saved("Estante do seu jeito");
    }
    setEditing(null);
  }

  function emptyText(): ReactNode {
    if (rows.length === 0) return "Nenhum livro ainda. Use a busca para adicionar.";
    if (page.shelf && page.all.length === 0) {
      return (
        <span className="flex flex-col items-center gap-3">
          Os livros chegam aqui.
          <button
            type="button"
            onClick={() => store.pickBooksFor(page.shelf!.id)}
            className="bg-accent-gradient rounded-full px-5 py-2.5 font-mono text-xs not-italic tracking-wider text-accent-foreground uppercase shadow-md shadow-accent/30"
          >
            Escolher livros
          </button>
        </span>
      );
    }
    if (page.items.length === 0) return "Nenhum livro com esses filtros.";
    return null;
  }

  if (all.isPending) return <Spinner />;

  const ink = dark ? "text-[#F3EAF2]" : "text-[#3A2E3F]";
  const glass = dark
    ? "border-white/15 bg-black/25 hover:bg-black/35"
    : "border-white/70 bg-white/55 hover:bg-white/75";

  const chrome = selecting ? (
    <div
      className={cn(
        "flex items-center gap-3 rounded-full border p-1.5 backdrop-blur-xl animate-[toast-in_.35s_cubic-bezier(.3,1.4,.5,1)_both] motion-reduce:animate-none",
        glass,
        ink,
      )}
    >
      <button
        type="button"
        onClick={() => (picking ? store.openShelf(picking.id) : store.setSelecting(false))}
        className="flex min-h-10 items-center gap-2 rounded-full py-1 pr-4 pl-1 font-mono text-xs tracking-wider uppercase transition hover:bg-black/5"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-black/5">
          <BarIcon d="M6 6l12 12M18 6 6 18" />
        </span>
        Cancelar
      </button>
      <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
        <span
          aria-hidden="true"
          className="bg-accent-gradient hidden size-9 items-center justify-center rounded-xl text-accent-foreground shadow-md shadow-accent/30 sm:flex"
        >
          <BarIcon d="M4 5h16v14H4zM8 12l3 3 5-6" />
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase opacity-60">
            {picking ? `Escolhendo para ${picking.name}` : "Selecionando"}
          </span>
          <span className="truncate font-serif text-lg italic">
            {selected.length === 0
              ? "Clique nos livros"
              : `${selected.length} ${selected.length === 1 ? "escolhido" : "escolhidos"}`}
          </span>
        </span>
      </div>
      <button
        type="button"
        aria-pressed={allPicked}
        onClick={() => store.selectAll(allPicked ? [] : page.items.map((row) => row.entry.id))}
        className="flex min-h-10 items-center gap-2 rounded-full py-1 pr-1 pl-4 font-mono text-xs tracking-wider uppercase transition hover:bg-black/5"
      >
        {allPicked ? "Nenhum" : "Todos"}
        <span className="flex size-8 items-center justify-center rounded-full bg-black/5">
          <BarIcon d={allPicked ? "M5 12h14" : "M4 12l4 4 8-8M12 16l8-8"} />
        </span>
      </button>
    </div>
  ) : (
    <div className="flex flex-wrap items-center gap-2">
      <Popover
        className="w-[min(34rem,calc(100vw-2rem))]"
        trigger={({ open, toggle }) => (
          <button
            type="button"
            aria-expanded={open}
            aria-label={`Estante ${page.name}. Trocar de estante`}
            onClick={toggle}
            className={cn(
              "flex min-h-[52px] max-w-[28rem] items-center gap-3 rounded-[18px] border px-4 py-1.5 text-left backdrop-blur-xl transition",
              glass,
              ink,
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate font-serif text-xl leading-tight font-medium italic">
                {page.name}
              </span>
              <span className="block truncate font-mono text-[10px] tracking-wider opacity-70">
                {booksLabel(page.all.length)} · {SHELF_MODEL_LABELS[style.model].name.toLowerCase()}{" "}
                · {SHELF_MATERIAL_LABELS[style.material].name.toLowerCase()}
                {page.shelf ? (page.shelf.isPublic ? " · no perfil" : " · só você") : ""}
              </span>
            </span>
            <ChevronDownIcon className="size-4" />
          </button>
        )}
      >
        {(close) => (
          <div className="flex flex-col gap-3 p-2">
            <p className="font-serif text-xl italic">Minhas estantes</p>
            <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
              {pages.map((item) => (
                <button
                  key={item.id ?? "all"}
                  type="button"
                  aria-pressed={item.id === page.id}
                  onClick={() => {
                    store.openShelf(item.id);
                    close();
                  }}
                  className="flex flex-col gap-1 text-left transition active:scale-95"
                >
                  <BookcaseThumb
                    style={item.style}
                    titles={item.all.slice(0, 15).map((row) => row.book.title)}
                    height={96}
                    ring={item.id === page.id}
                  />
                  <span className="truncate text-sm font-bold">{item.name}</span>
                  <span className="font-mono text-[10px] text-text-muted">
                    {booksLabel(item.all.length)}
                    {item.shelf ? (item.shelf.isPublic ? " · no perfil" : " · só você") : ""}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  close();
                  naming.askNew([], (id) => {
                    store.openShelf(id);
                    setCustomizeNext(id);
                  });
                }}
                className="flex flex-col gap-1 text-left transition active:scale-95"
              >
                <span className="flex h-24 items-center justify-center rounded-[14px] border-[1.5px] border-dashed border-border text-2xl text-accent-ink">
                  +
                </span>
                <span className="text-sm font-bold">Nova estante</span>
                <span className="font-mono text-[10px] text-text-muted">do seu jeito</span>
              </button>
            </div>
          </div>
        )}
      </Popover>

      <Popover
        className="w-[min(24rem,calc(100vw-2rem))]"
        trigger={({ open, toggle }) => (
          <RoundButton
            label={activeFilters > 0 ? `Filtros, ${activeFilters} ativos` : "Filtros"}
            expanded={open}
            onClick={toggle}
            glass={cn(glass, ink)}
            badge={activeFilters}
          >
            <SlidersIcon />
          </RoundButton>
        )}
      >
        {() => (
          <div className="flex flex-col gap-4 p-2">
            <div className="flex flex-col gap-2">
              <p className="font-mono text-[10px] tracking-[0.12em] text-text-muted uppercase">
                Situação
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SHELF_STATUSES.map((status) => {
                  const on = filter.statuses.includes(status);
                  return (
                    <button
                      key={status}
                      type="button"
                      aria-pressed={on}
                      onClick={() => store.toggle("statuses", status)}
                      className={cn(
                        "flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-sm transition",
                        on
                          ? "border-2 border-accent bg-glow-b font-bold"
                          : "border-border hover:border-accent/50",
                      )}
                    >
                      {SHELF_LABELS[status]}
                      <span className="font-mono text-xs">{counts[status]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {genres.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="font-mono text-[10px] tracking-[0.12em] text-text-muted uppercase">
                  Gênero
                </p>
                <div className="flex max-h-44 flex-wrap gap-2.5 overflow-y-auto p-1.5 pr-3">
                  {genres.map((genre) => (
                    <FilterChip
                      key={genre}
                      on={filter.genres.includes(genre)}
                      onClick={() => store.toggle("genres", genre)}
                    >
                      {GENRE_LABELS[genre as Genre] ?? genre}
                    </FilterChip>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-edge pt-3">
              <button
                type="button"
                onClick={store.clearFilter}
                className="font-mono text-xs tracking-wider text-text-muted uppercase hover:text-text"
              >
                Limpar
              </button>
              <span className="font-mono text-xs">{booksLabel(page.items.length)}</span>
            </div>
          </div>
        )}
      </Popover>

      {page.shelf && <ShelfMenu shelf={page.shelf} naming={naming} glass={cn(glass, ink)} />}

      <RoundButton
        label="Personalizar estante"
        primary
        expanded={editing !== null}
        onClick={() => (editing ? doneEditing() : setEditing(page.style))}
      >
        <BrushIcon />
      </RoundButton>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <ChromeButton glass={cn(glass, ink)} onClick={() => store.setSelecting(true)}>
          Selecionar
        </ChromeButton>
        <Link
          to="/importar"
          className={cn(
            "rounded-full border px-4 py-2.5 font-mono text-xs tracking-wider uppercase backdrop-blur-xl transition",
            glass,
            ink,
          )}
        >
          Importar
        </Link>
        <Link
          to="/search"
          className="bg-accent-gradient rounded-full px-4 py-2.5 font-mono text-xs font-medium tracking-wider text-accent-foreground uppercase shadow-md shadow-accent/30 hover:opacity-90"
        >
          + Adicionar livro
        </Link>
      </div>
    </div>
  );

  return (
    <div
      data-shelf-room
      className="relative flex min-h-[calc(100dvh-6rem)] flex-col"
      onPointerDown={(event) => {
        swipe.current = event.pointerType === "touch" ? event.clientX : null;
      }}
      onPointerUp={(event) => {
        if (swipe.current === null) return;
        const dx = event.clientX - swipe.current;
        swipe.current = null;
        if (Math.abs(dx) > 70) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="relative z-10 flex flex-col gap-2 px-4 pt-2 lg:px-8">
        <h1 className={cn("sr-only")}>Estantes</h1>
        {chrome}
        {picking && (
          <p className="glass rounded-lg px-4 py-3 text-sm">
            Escolha os livros para a estante {picking.name} e clique em Adicionar.
          </p>
        )}
        {!selecting && activeFilters > 0 && (
          <div className="flex flex-wrap gap-2">
            {filter.statuses.map((status) => (
              <FilterChip key={status} on onClick={() => store.toggle("statuses", status)}>
                {SHELF_LABELS[status]} ✕
              </FilterChip>
            ))}
            {filter.genres.map((genre) => (
              <FilterChip key={genre} on onClick={() => store.toggle("genres", genre)}>
                {GENRE_LABELS[genre as Genre] ?? genre} ✕
              </FilterChip>
            ))}
            <FilterChip on={false} onClick={store.clearFilter}>
              Limpar
            </FilterChip>
          </div>
        )}
      </div>

      <div
        className={cn(
          "grid flex-1 items-stretch gap-6 px-4 pt-4 pb-8 lg:px-8",
          editing
            ? "pb-[62vh] @5xl/main:grid-cols-[minmax(0,1fr)_26rem] @5xl/main:pb-8"
            : undefined,
        )}
      >
        <div className="relative flex min-w-0 flex-col">
          <Bookcase
            key={page.id ?? "all"}
            items={page.items}
            style={style}
            name={page.name}
            fill
            selecting={selecting}
            selected={selected}
            onPick={(row) => store.toggleSelected(row.entry.id)}
            empty={emptyText()}
          />
          {pages.length > 1 && !selecting && !editing && (
            <>
              <PagerArrow side="left" glass={cn(glass, ink)} onClick={() => go(-1)} />
              <PagerArrow side="right" glass={cn(glass, ink)} onClick={() => go(1)} />
              <div className="pointer-events-none sticky bottom-28 z-10 mt-4 flex justify-center lg:bottom-6">
                <div className="glass pointer-events-auto flex items-center gap-1.5 rounded-full px-2.5 py-2">
                  {pages.map((item, i) => (
                    <button
                      key={item.id ?? "all"}
                      type="button"
                      aria-label={item.name}
                      aria-current={i === index}
                      onClick={() => store.openShelf(item.id)}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        i === index ? "w-[18px] bg-accent" : "w-1.5 bg-border hover:bg-text-muted",
                      )}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        {editing && (
          <CustomizePanel
            style={editing}
            titles={page.all.slice(0, 15).map((row) => row.book.title)}
            onChange={setEditing}
            onDone={doneEditing}
            onCancel={() => setEditing(null)}
          />
        )}
        {editing && (
          // Floats over the page on wide screens: no scrolling to the foot of the editor to save.
          <CustomizeActions
            onDone={doneEditing}
            onCancel={() => setEditing(null)}
            className="glass fixed inset-x-0 bottom-6 z-40 mx-auto hidden w-[26rem] max-w-[calc(100%-2rem)] rounded-full p-2 animate-[toast-in_.35s_cubic-bezier(.3,1.4,.5,1)_both] motion-reduce:animate-none @5xl/main:flex"
          />
        )}
      </div>

      {selecting && <SelectBar page={page} naming={naming} />}
      {naming.dialog}
    </div>
  );
}

function PagerArrow({
  side,
  glass,
  onClick,
}: {
  side: "left" | "right";
  glass: string;
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <button
      type="button"
      aria-label={side === "left" ? "Estante anterior" : "Próxima estante"}
      onClick={onClick}
      className={cn(
        "absolute top-40 z-10 hidden size-11 items-center justify-center rounded-full border backdrop-blur-xl transition sm:flex",
        side === "left" ? "-left-2" : "-right-2",
        glass,
      )}
    >
      <Icon />
    </button>
  );
}

function ChromeButton({
  glass,
  onClick,
  children,
}: {
  glass: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-2.5 font-mono text-xs tracking-wider uppercase transition",
        glass ? cn("border backdrop-blur-xl", glass) : "hover:bg-black/5",
      )}
    >
      {children}
    </button>
  );
}

function FilterChip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "min-h-9 rounded-full border px-3.5 text-sm transition",
        on
          ? "border-accent bg-surface font-semibold text-text"
          : "glass text-text hover:border-accent/50",
      )}
    >
      {children}
    </button>
  );
}

/** A round button on the wall; `primary` is the rose → lavender one. */
function RoundButton({
  label,
  badge = 0,
  primary = false,
  expanded,
  glass = "",
  onClick,
  children,
}: {
  label: string;
  badge?: number;
  primary?: boolean;
  expanded?: boolean;
  glass?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-expanded={expanded}
      onClick={onClick}
      className={cn(
        "relative flex size-[52px] shrink-0 items-center justify-center rounded-[18px] transition active:scale-95",
        primary
          ? "bg-accent-gradient text-accent-foreground shadow-lg shadow-accent/30"
          : cn("border backdrop-blur-xl", glass),
      )}
    >
      {children}
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 font-mono text-[11px] text-accent-foreground">
          {badge}
        </span>
      )}
    </button>
  );
}

/** ⋯ on a shelf you made: rename, duplicate, show on the profile or not, delete (undoable). */
function ShelfMenu({
  shelf,
  naming,
  glass,
}: {
  shelf: MyShelf;
  naming: ReturnType<typeof useShelfNaming>;
  glass: string;
}) {
  const setPublic = useSetShelfPublic();
  const remove = useRemoveShelf();
  const create = useCreateShelf();
  const store = useShelfScreenStore();

  return (
    <Popover
      className="w-56"
      trigger={({ open, toggle }) => (
        <RoundButton
          label={`Opções da estante ${shelf.name}`}
          expanded={open}
          onClick={toggle}
          glass={glass}
        >
          <span aria-hidden="true" className="text-lg leading-none">
            ⋯
          </span>
        </RoundButton>
      )}
    >
      {(close) => (
        <div role="menu" className="flex flex-col">
          <MenuItem
            onClick={() => {
              close();
              naming.askRename(shelf);
            }}
          >
            Renomear
          </MenuItem>
          <MenuItem
            onClick={() => {
              close();
              naming.askDuplicate(shelf, (id) => {
                store.openShelf(id);
                store.setSelecting(true);
              });
            }}
          >
            Duplicar
          </MenuItem>
          <MenuItem
            onClick={() => {
              close();
              setPublic.mutate(
                { id: shelf.id, isPublic: !shelf.isPublic },
                { onError: (error) => toast.failed(error) },
              );
              toast.saved(shelf.isPublic ? "Agora só você vê" : "Agora aparece no seu perfil");
            }}
          >
            {shelf.isPublic ? "Deixar só para mim" : "Mostrar no perfil"}
          </MenuItem>
          <MenuItem
            danger
            onClick={() => {
              close();
              remove.mutate(shelf.id, {
                onSuccess: ({ entryIds, name, style }) => {
                  store.openShelf(null);
                  toast.saved(`Estante ${name} apagada. Os livros continuam nas suas leituras.`, {
                    label: "Desfazer",
                    run: () =>
                      create.mutate(
                        { name, isPublic: shelf.isPublic, entryIds, style },
                        {
                          onSuccess: ({ id }) => store.openShelf(id),
                          onError: (error) => toast.failed(error),
                        },
                      ),
                  });
                },
                onError: (error) => toast.failed(error),
              });
            }}
          >
            Apagar estante
          </MenuItem>
        </div>
      )}
    </Popover>
  );
}

/**
 * Select mode's actions, floating at the bottom: add the picked books to a shelf, move them,
 * take them off this shelf, or make a new shelf with them. While picking for an empty shelf, just
 * "Adicionar a …".
 */
function SelectBar({ page, naming }: { page: Page; naming: ReturnType<typeof useShelfNaming> }) {
  const shelves = useMyShelves().data?.items ?? [];
  const setBooks = useSetShelfBooks();
  const move = useMoveBooks();
  const { selected, pickingFor, setSelecting, openShelf } = useShelfScreenStore();
  const current = page.shelf;
  const picking = shelves.find((shelf) => shelf.id === pickingFor) ?? null;
  const targets = shelves.filter((shelf) => shelf.id !== current?.id);

  function ready() {
    if (selected.length === 0) {
      toast.info("Clique nos livros para escolher.");
      return false;
    }
    if (selected.length > MAX_BULK_BOOKS) {
      toast.info(`Escolha até ${MAX_BULK_BOOKS} livros de uma vez.`);
      return false;
    }
    return true;
  }

  function add(target: MyShelf, then?: () => void) {
    if (!ready()) return;
    const entryIds = [...selected];
    setBooks.mutate(
      { shelfId: target.id, entryIds, on: true },
      { onError: (error) => toast.failed(error) },
    );
    toast.saved(`${booksLabel(entryIds.length)} na estante ${target.name}`, {
      label: "Desfazer",
      run: () => setBooks.mutate({ shelfId: target.id, entryIds, on: false }),
    });
    setSelecting(false);
    then?.();
  }

  function moveTo(target: MyShelf) {
    if (!current || !ready()) return;
    const entryIds = [...selected];
    move.mutate(
      { fromId: current.id, toId: target.id, entryIds },
      { onError: (error) => toast.failed(error) },
    );
    toast.saved(`${booksLabel(entryIds.length)} movidos para ${target.name}`, {
      label: "Desfazer",
      run: () => move.mutate({ fromId: target.id, toId: current.id, entryIds }),
    });
    setSelecting(false);
  }

  function takeOff() {
    if (!current || !ready()) return;
    const entryIds = [...selected];
    setBooks.mutate(
      { shelfId: current.id, entryIds, on: false },
      { onError: (error) => toast.failed(error) },
    );
    toast.saved(`${booksLabel(entryIds.length)} fora da estante ${current.name}`, {
      label: "Desfazer",
      run: () => setBooks.mutate({ shelfId: current.id, entryIds, on: true }),
    });
    setSelecting(false);
  }

  const newShelf = () => ready() && naming.askNew([...selected], (id) => openShelf(id));

  const shelfList = (action: (target: MyShelf) => void) => (close: () => void) => (
    <div role="menu" className="flex max-h-72 flex-col overflow-y-auto">
      {targets.map((target) => (
        <MenuItem
          key={target.id}
          onClick={() => {
            close();
            action(target);
          }}
        >
          {target.name}
        </MenuItem>
      ))}
      <MenuItem
        onClick={() => {
          close();
          newShelf();
        }}
      >
        Nova estante…
      </MenuItem>
    </div>
  );

  return (
    <div className="glass fixed inset-x-4 bottom-28 z-30 mx-auto flex max-w-2xl items-center gap-1 rounded-full p-1.5 animate-[toast-in_.4s_cubic-bezier(.3,1.4,.5,1)_both] motion-reduce:animate-none lg:bottom-8">
      <span className="flex shrink-0 items-center gap-2 py-1 pr-3 pl-1">
        <span
          key={selected.length}
          className="bg-accent-gradient flex size-10 items-center justify-center rounded-full font-mono text-sm font-semibold text-accent-foreground shadow-md shadow-accent/30 animate-[shelf-pop_.35s_cubic-bezier(.3,1.6,.5,1)_both] motion-reduce:animate-none"
        >
          {selected.length}
        </span>
        <span className="hidden font-mono text-[10px] leading-tight tracking-[0.12em] text-text-muted uppercase sm:block">
          {selected.length === 1 ? "livro" : "livros"}
          <br />
          {selected.length === 1 ? "escolhido" : "escolhidos"}
        </span>
      </span>
      <span aria-hidden="true" className="h-8 w-px shrink-0 bg-edge" />
      {picking ? (
        <button
          type="button"
          onClick={() => add(picking, () => openShelf(picking.id))}
          className="bg-accent-gradient ml-auto flex min-h-11 items-center gap-2 rounded-full px-5 font-mono text-xs tracking-wider text-accent-foreground uppercase shadow-md shadow-accent/30 transition active:scale-95"
        >
          <BarIcon d="M12 5v14M5 12h14" />
          Adicionar a {picking.name}
        </button>
      ) : (
        <>
          <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
            <Popover
              placement="above"
              className="w-56"
              trigger={({ toggle }) => (
                <BarAction icon="M12 5v14M5 12h14" label="Adicionar a…" onClick={toggle} />
              )}
            >
              {shelfList((target) => add(target))}
            </Popover>
            {current && (
              <Popover
                placement="above"
                className="w-56"
                trigger={({ toggle }) => (
                  <BarAction icon="M5 12h14M13 6l6 6-6 6" label="Mover para…" onClick={toggle} />
                )}
              >
                {shelfList(moveTo)}
              </Popover>
            )}
            {current && (
              <BarAction icon="M6 6l12 12M18 6 6 18" label="Tirar daqui" onClick={takeOff} />
            )}
          </div>
          <button
            type="button"
            onClick={newShelf}
            className="bg-accent-gradient flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 font-mono text-[11px] tracking-wider text-accent-foreground uppercase shadow-md shadow-accent/30 transition active:scale-95"
          >
            <BarIcon d="M4 7h16v13H4zM9 3h6v4M12 11v6M9 14h6" />
            Nova estante
          </button>
        </>
      )}
    </div>
  );
}

function BarIcon({ d }: { d: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 shrink-0"
    >
      <path d={d} />
    </svg>
  );
}

function BarAction({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm whitespace-nowrap transition hover:bg-surface-muted active:scale-95"
    >
      <span className="flex size-7 items-center justify-center rounded-full bg-surface-muted text-accent-ink">
        <BarIcon d={icon} />
      </span>
      {label}
    </button>
  );
}
