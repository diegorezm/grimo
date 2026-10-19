import { greetingFor, readingPercent, SHELF_LABELS, SHELF_STATUSES } from "@grimo/core";
import type { ReactNode } from "react";
import { HomeIcon, SearchIcon, ShelvesIcon, UserIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { BookCover } from "@/features/books";
import { cn } from "@/utils/cn";
import { demoMe, demoOverview, demoShelf } from "../demo-data";

/** iPhone 16 screen in points. The frame adds the bezel around it. */
const SCREEN = { width: 393, height: 852 };
const BEZEL = 13;

/**
 * The mobile app's home screen (apps/mobile dashboard: greeting, current book, goal, shelves)
 * with the demo reader, in an iPhone 16 frame: Dynamic Island, status bar, side buttons and the
 * iOS 26 floating tab bar. Drawn at real size (393 × 852 pt) and scaled to `width`.
 */
export function IPhoneDemo({ width = 280, className }: { width?: number; className?: string }) {
  const outer = { width: SCREEN.width + BEZEL * 2, height: SCREEN.height + BEZEL * 2 };
  const scale = width / outer.width;
  return (
    <div
      style={{ width: outer.width * scale, height: outer.height * scale }}
      className={cn("shrink-0", className)}
    >
      <div style={{ ...outer, transform: `scale(${scale})` }} className="relative origin-top-left">
        {/* Side buttons: action + volume on the left, side button on the right. */}
        {[
          { side: "left", top: 160, height: 34 },
          { side: "left", top: 222, height: 64 },
          { side: "left", top: 298, height: 64 },
          { side: "right", top: 250, height: 100 },
        ].map((button) => (
          <span
            key={`${button.side}-${button.top}`}
            style={{ top: button.top, height: button.height }}
            className={cn(
              "absolute w-[5px] rounded-sm bg-inverse",
              button.side === "left" ? "-left-[3px]" : "-right-[3px]",
            )}
          />
        ))}

        <div
          style={{ padding: BEZEL }}
          className="h-full rounded-[68px] bg-inverse shadow-2xl shadow-shadow ring-1 ring-border"
        >
          <div className="relative h-full overflow-hidden rounded-[55px] bg-background">
            <StatusBar />
            <HomeScreen />
            <TabBar />
            <span className="absolute bottom-2 left-1/2 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-text/80" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="absolute inset-x-0 top-0 z-10 flex h-[54px] items-center justify-between px-9 pt-1 text-text">
      <span className="w-14 text-center text-[17px] font-semibold">9:41</span>
      {/* Dynamic Island */}
      <span className="absolute top-[11px] left-1/2 h-[37px] w-[126px] -translate-x-1/2 rounded-full bg-black" />
      <span className="flex items-center gap-1.5">
        <svg viewBox="0 0 18 12" className="h-3 w-[18px] fill-current" aria-hidden="true">
          {[0, 1, 2, 3].map((bar) => (
            <rect key={bar} x={bar * 5} y={9 - bar * 3} width="3" height={3 + bar * 3} rx="1" />
          ))}
        </svg>
        <svg
          viewBox="0 0 16 12"
          className="h-3 w-4 fill-none stroke-current"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M1.5 4.2a9.5 9.5 0 0 1 13 0M4 7a6 6 0 0 1 8 0" />
          <circle cx="8" cy="10" r="1" className="fill-current" />
        </svg>
        <span className="flex h-3 w-[26px] items-center rounded-[4px] border border-current p-[2px] opacity-90">
          <span className="h-full w-4/5 rounded-[2px] bg-current" />
        </span>
      </span>
    </div>
  );
}

/** apps/mobile/src/features/dashboard, drawn with the same tokens. */
function HomeScreen() {
  const reading = demoShelf.filter(({ entry }) => entry.status === "reading");
  const [current, ...others] = reading;
  const goal = demoOverview.goal!;
  const goalPercent = Math.round((goal.done / goal.target) * 100);
  const counts = Object.fromEntries(
    SHELF_STATUSES.map((status) => [
      status,
      demoShelf.filter(({ entry }) => entry.status === status).length,
    ]),
  );

  return (
    <div className="flex flex-col gap-5 px-4 pt-[62px] pb-32">
      <div className="flex items-center gap-3">
        <Logo className="h-12" />
        <div>
          <Label>{greetingFor(new Date())}</Label>
          <p className="font-serif text-[36px] leading-tight font-bold">{demoMe.name}</p>
        </div>
      </div>

      {current && (
        <div className="relative flex flex-col gap-4 rounded-[18px] border border-edge bg-surface p-4 shadow-lg shadow-shadow">
          <span className="absolute -top-2 right-7 h-[18px] w-16 rotate-[4deg] bg-accent-start opacity-80" />
          <div className="flex gap-4">
            <BookCover
              src={current.book.coverUrl}
              title={current.book.title}
              className="w-[88px]"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Label className="text-accent">Lendo agora</Label>
              <p className="line-clamp-2 font-serif text-[20px] leading-6">{current.book.title}</p>
              <p className="truncate text-sm text-text-muted">{current.book.authors.join(", ")}</p>
              <div className="mt-auto flex flex-col gap-1">
                <Bar
                  percent={readingPercent(current.entry.currentPage, current.book.pageCount) ?? 0}
                />
                <Label>
                  p.{current.entry.currentPage} de {current.book.pageCount} ·{" "}
                  {readingPercent(current.entry.currentPage, current.book.pageCount)}%
                </Label>
              </div>
            </div>
          </div>
          <span className="rounded-full bg-accent py-3 text-center font-mono text-[11px] uppercase tracking-[1px] text-accent-foreground shadow-lg shadow-accent/35">
            Atualizar progresso
          </span>
        </div>
      )}

      <section className="flex flex-col gap-3">
        <Heading>Também lendo</Heading>
        <div className="flex gap-4">
          {others.map(({ entry, book }) => (
            <div key={entry.id} className="w-24">
              <BookCover src={book.coverUrl} title={book.title} className="w-24" />
              <p className="mt-1.5 truncate font-serif text-sm">{book.title}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-[18px] border border-edge bg-surface p-4 shadow-lg shadow-shadow">
        <Label>Meta de leitura</Label>
        <Heading>
          {goal.done} de {goal.target} livros em {demoOverview.year}
        </Heading>
        <div className="h-2.5 overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full rounded-full bg-gold" style={{ width: `${goalPercent}%` }} />
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <Heading>Estantes</Heading>
        <div className="grid grid-cols-2 gap-2">
          {SHELF_STATUSES.map((status) => (
            <div
              key={status}
              className={cn(
                "flex min-h-[72px] flex-col gap-0.5 rounded-[18px] border-[1.5px] p-3",
                SHELF_TILE[status],
              )}
            >
              <span className="font-mono text-[26px] font-bold">{counts[status]}</span>
              <Label className="text-current">{SHELF_LABELS[status]}</Label>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const SHELF_TILE = {
  want_to_read:
    "bg-shelf-want-to-read-bg border-shelf-want-to-read-border text-shelf-want-to-read-fg",
  reading: "bg-shelf-reading-bg border-shelf-reading-fg text-shelf-reading-fg",
  read: "bg-shelf-read-bg border-shelf-read-border text-shelf-read-fg",
  abandoned: "bg-shelf-abandoned-bg border-shelf-abandoned-border text-shelf-abandoned-fg",
} as const;

/** iOS 26 tab bar: a floating liquid-glass capsule tinted with the accent. */
function TabBar() {
  const tabs = [
    { label: "Feed", icon: HomeIcon, active: true },
    { label: "Buscar", icon: SearchIcon },
    { label: "Estantes", icon: ShelvesIcon },
    { label: "Perfil", icon: UserIcon },
  ];
  return (
    <nav className="glass absolute inset-x-5 bottom-7 flex justify-around rounded-full px-2 py-1.5">
      {tabs.map((tab) => (
        <span
          key={tab.label}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 rounded-full py-1.5 text-[10px] font-medium",
            tab.active ? "bg-surface-muted text-accent" : "text-text",
          )}
        >
          <tab.icon className="size-6" />
          {tab.label}
        </span>
      ))}
    </nav>
  );
}

function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn("font-mono text-[11px] uppercase tracking-[1px] text-text-muted", className)}
    >
      {children}
    </span>
  );
}

function Heading({ children }: { children: ReactNode }) {
  return <p className="font-serif text-[28px] leading-tight font-bold">{children}</p>;
}

function Bar({ percent }: { percent: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
      <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
    </div>
  );
}
