import {
  applyShelfChoice,
  presetOf,
  SHELF_COMBINATIONS,
  SHELF_DECOR,
  SHELF_DECOR_LABELS,
  SHELF_LAYOUT_LABELS,
  SHELF_LAYOUTS,
  SHELF_LIGHT_LABELS,
  SHELF_LIGHTS,
  SHELF_MATERIAL_LABELS,
  SHELF_MATERIALS,
  SHELF_MODEL_LABELS,
  SHELF_MODELS,
  SHELF_PRESETS,
  SHELF_SORT_LABELS,
  SHELF_SORTS,
  type ShelfLayout,
  type ShelfStyle,
  SPINE_FINISH_LABELS,
  SPINE_FINISHES,
  spineSize,
  toggleDecor,
} from "@grimo/core";
import { shelfBrass, shelfMaterials } from "@grimo/tokens";
import { type ReactNode, useState } from "react";
import { CheckIcon, ChevronDownIcon } from "@/components/ui/icons";
import { MenuItem, Popover } from "@/components/ui/popover";
import { cn } from "@/utils/cn";
import { ShelfDecorArt } from "../bookcase/decor";
import { bindingOf, materialOf, spineColor } from "../bookcase/look";
import { BookcaseThumb } from "../bookcase/thumb";

const TABS = ["Prontos", "Modelo", "Cores", "Lombadas", "Arrumar", "Enfeites", "Luz"] as const;
type Tab = (typeof TABS)[number];
/** Always in the bar; the rest wait in "Mais" (the panel is too narrow for seven). */
const MAIN_TABS: Tab[] = ["Prontos", "Modelo", "Cores"];
const MORE_TABS: Tab[] = TABS.filter((name) => !MAIN_TABS.includes(name));

const LIGHT_SWATCH = {
  day: "linear-gradient(180deg, var(--color-surface), var(--color-surface-muted))",
  sunset: `linear-gradient(200deg, ${shelfBrass.light}, var(--color-glow-a) 70%)`,
  lamp: `radial-gradient(ellipse at 50% 0%, ${shelfBrass.light}, ${shelfBrass.ink} 75%)`,
} as const;

/**
 * "Do seu jeito": every layer of the shelf, changed live on the bookcase beside it (the web twin
 * of mobile's `CustomizeSheet`). On a wide screen it sits next to the bookcase; on a narrow one it
 * rises from the bottom. Nothing is saved until "Ficou a minha cara".
 */
export function CustomizePanel({
  style,
  titles,
  onChange,
  onDone,
  onCancel,
}: {
  style: ShelfStyle;
  /** Titles of the shelf's books, for the drawings. */
  titles: readonly string[];
  onChange: (style: ShelfStyle) => void;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [tab, setTab] = useState<Tab>("Prontos");
  const set = (patch: Partial<ShelfStyle>) => onChange(applyShelfChoice(style, patch));
  const current = presetOf(style);
  const sample = titles.length > 0 ? titles : ["A", "B", "C", "D", "E", "F"];

  return (
    <section
      aria-label="Personalizar estante"
      className={cn(
        "glass fixed inset-x-0 bottom-0 z-30 flex max-h-[62vh] flex-col gap-3 rounded-t-[28px] pt-2.5 pb-5 animate-[shelf-sheet-up_.45s_cubic-bezier(.2,1.1,.3,1)_both] motion-reduce:animate-none",
        "@5xl/main:sticky @5xl/main:top-6 @5xl/main:max-h-[calc(100dvh-3rem)] @5xl/main:animate-peek @5xl/main:rounded-3xl @5xl/main:pt-5 @5xl/main:pb-24",
      )}
    >
      <div className="h-[5px] w-10 self-center rounded-full bg-border @5xl/main:hidden" />
      <div className="flex items-baseline justify-between gap-3 px-5">
        <h2 className="text-2xl font-medium italic">Do seu jeito</h2>
        <span className="font-mono text-[10px] tracking-widest text-text-muted uppercase">
          {current ? current.name : `${SHELF_COMBINATIONS.toLocaleString("pt-BR")} combinações`}
        </span>
      </div>

      <div role="tablist" className="flex shrink-0 flex-wrap items-center gap-1.5 px-5">
        {MAIN_TABS.map((name) => (
          <TabButton key={name} active={tab === name} onClick={() => setTab(name)}>
            <TabIcon tab={name} />
            {name}
          </TabButton>
        ))}
        <Popover
          align="right"
          className="w-44"
          trigger={({ open, toggle }) => (
            <TabButton active={MORE_TABS.includes(tab)} expanded={open} onClick={toggle}>
              {MORE_TABS.includes(tab) && <TabIcon tab={tab} />}
              {MORE_TABS.includes(tab) ? tab : "Mais"}
              <ChevronDownIcon className="size-3.5" />
            </TabButton>
          )}
        >
          {(close) => (
            <div role="menu" className="flex flex-col">
              {MORE_TABS.map((name) => (
                <MenuItem
                  key={name}
                  onClick={() => {
                    setTab(name);
                    close();
                  }}
                >
                  <TabIcon tab={name} />
                  <span className={cn("flex-1", tab === name && "font-bold")}>{name}</span>
                  {tab === name && <CheckIcon className="size-4 text-accent" />}
                </MenuItem>
              ))}
            </div>
          )}
        </Popover>
      </div>

      <div key={tab} className="min-h-0 flex-1 overflow-y-auto px-5 pb-2">
        <div className="grid grid-cols-6 gap-3">
          {tab === "Prontos" &&
            SHELF_PRESETS.map((preset, i) => (
              <Option
                key={preset.id}
                span={3}
                index={i}
                on={current?.id === preset.id}
                title={preset.name}
                hint={preset.hint}
                onClick={() => onChange(preset.style)}
              >
                <BookcaseThumb
                  style={preset.style}
                  titles={sample}
                  ring={current?.id === preset.id}
                />
              </Option>
            ))}

          {tab === "Modelo" &&
            SHELF_MODELS.map((model, i) => (
              <Option
                key={model}
                span={3}
                index={i}
                on={style.model === model}
                title={SHELF_MODEL_LABELS[model].name}
                hint={SHELF_MODEL_LABELS[model].hint}
                onClick={() => set({ model })}
              >
                <BookcaseThumb
                  style={{ ...style, model }}
                  titles={sample}
                  ring={style.model === model}
                />
              </Option>
            ))}

          {tab === "Cores" &&
            SHELF_MATERIALS.map((material, i) => {
              const m = shelfMaterials[material];
              const on = style.material === material;
              return (
                <Option
                  key={material}
                  span={2}
                  index={i}
                  on={on}
                  title={SHELF_MATERIAL_LABELS[material].name}
                  hint={SHELF_MATERIAL_LABELS[material].hint}
                  onClick={() => set({ material })}
                >
                  <span
                    className={cn(
                      "grid h-[70px] grid-cols-2 overflow-hidden rounded-xl outline-2 -outline-offset-2",
                      on ? "outline-accent" : "outline-transparent",
                    )}
                  >
                    <span style={{ background: m.room }} />
                    <span className="flex flex-col">
                      <span className="flex-1" style={{ background: m.side }} />
                      <span className="flex-1" style={{ background: m.back }} />
                      <span className="h-3" style={{ background: m.plank }} />
                    </span>
                  </span>
                </Option>
              );
            })}

          {tab === "Lombadas" &&
            SPINE_FINISHES.map((finish, i) => (
              <Option
                key={finish}
                span={3}
                index={i}
                boxed
                on={style.finish === finish}
                title={SPINE_FINISH_LABELS[finish].name}
                hint={SPINE_FINISH_LABELS[finish].hint}
                onClick={() => set({ finish })}
              >
                <span className="flex h-[66px] items-end gap-0.5">
                  {sample.slice(0, 6).map((title, k) => {
                    const size = spineSize(title, null);
                    const paint = finish === "cover" ? "tone" : finish;
                    return (
                      <span
                        key={`${title}-${k}`}
                        className="rounded-[2px_2px_1px_1px]"
                        style={{
                          width: Math.round(size.width * 0.55),
                          height: Math.round(size.height * 0.42),
                          background:
                            finish === "cover"
                              ? `repeating-linear-gradient(160deg, rgba(255,255,255,.35) 0 6px, transparent 6px 14px), ${spineColor(materialOf(style), size.tone, paint)}`
                              : `${bindingOf(paint)}, ${spineColor(materialOf(style), size.tone, paint)}`,
                        }}
                      />
                    );
                  })}
                </span>
              </Option>
            ))}

          {tab === "Arrumar" && (
            <>
              <Label>Como ficam</Label>
              {SHELF_LAYOUTS.map((layout, i) => (
                <Option
                  key={layout}
                  span={2}
                  index={i}
                  boxed
                  center
                  on={style.layout === layout}
                  title={SHELF_LAYOUT_LABELS[layout]}
                  onClick={() => set({ layout })}
                >
                  <LayoutDrawing layout={layout} />
                </Option>
              ))}
              <Label>Em que ordem</Label>
              {SHELF_SORTS.map((sort, i) => (
                <Option
                  key={sort}
                  span={2}
                  index={i}
                  boxed
                  center
                  on={style.sort === sort}
                  title={SHELF_SORT_LABELS[sort]}
                  hint={
                    sort === "rainbow" && style.finish === "cover"
                      ? "Usa os tons do móvel"
                      : undefined
                  }
                  onClick={() => set({ sort })}
                />
              ))}
            </>
          )}

          {tab === "Enfeites" &&
            SHELF_DECOR.map((decor, i) => {
              const on = style.decor.includes(decor);
              return (
                <Option
                  key={decor}
                  span={2}
                  index={i}
                  boxed
                  center
                  on={on}
                  title={SHELF_DECOR_LABELS[decor]}
                  onClick={() => onChange(toggleDecor(style, decor))}
                >
                  {on && (
                    <span className="bg-accent-gradient absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full text-accent-foreground animate-[shelf-pop_.45s_cubic-bezier(.3,1.6,.5,1)_both]">
                      <CheckIcon className="size-3" strokeWidth={3.5} />
                    </span>
                  )}
                  <span
                    className="flex h-14 origin-bottom scale-[.78] items-end transition-opacity"
                    style={{ opacity: on ? 1 : 0.45 }}
                  >
                    <ShelfDecorArt decor={decor} still />
                  </span>
                </Option>
              );
            })}

          {tab === "Luz" &&
            SHELF_LIGHTS.map((light, i) => (
              <Option
                key={light}
                span={2}
                index={i}
                boxed
                on={style.light === light}
                title={SHELF_LIGHT_LABELS[light].name}
                hint={SHELF_LIGHT_LABELS[light].hint}
                onClick={() => set({ light })}
              >
                <span
                  className="h-[52px] w-full rounded-[10px]"
                  style={{ background: LIGHT_SWATCH[light] }}
                />
              </Option>
            ))}
        </div>
      </div>

      {/* On a wide screen the buttons float at the bottom instead (`CustomizeActions` in the screen). */}
      <CustomizeActions onDone={onDone} onCancel={onCancel} className="px-5 @5xl/main:hidden" />
    </section>
  );
}

/** "Cancelar" and "Ficou a minha cara": at the foot of the sheet, or floating (wide screens). */
export function CustomizeActions({
  onDone,
  onCancel,
  className,
}: {
  onDone: () => void;
  onCancel: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-2", className)}>
      <button
        type="button"
        onClick={onCancel}
        className="min-h-[54px] rounded-full px-5 font-mono text-xs tracking-wider text-text-muted uppercase transition hover:bg-surface-muted hover:text-text"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={onDone}
        className="bg-accent-gradient min-h-[54px] flex-1 rounded-full font-mono text-sm font-medium tracking-wider text-accent-foreground uppercase shadow-lg shadow-accent/30 transition active:scale-[.98]"
      >
        Ficou a minha cara
      </button>
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="col-span-6 mt-1 font-mono text-[10px] tracking-[0.12em] text-text-muted uppercase">
      {children}
    </p>
  );
}

/** One choice: a drawing (optional), its name and a hint. */
function Option({
  title,
  hint,
  on,
  span,
  index,
  boxed,
  center,
  onClick,
  children,
}: {
  title: string;
  hint?: string;
  on: boolean;
  span: 2 | 3;
  index: number;
  /** On a card (spines, objects): the ring goes around the card. */
  boxed?: boolean;
  center?: boolean;
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      style={{ animationDelay: `${index * 0.04}s` }}
      className={cn(
        "shelf-rise relative flex flex-col gap-1 text-left transition active:scale-95",
        span === 3 ? "col-span-3" : "col-span-2",
        center && "items-center text-center",
        boxed &&
          cn(
            "rounded-[14px] border-2 bg-surface p-3",
            on ? "border-accent" : "border-border hover:border-accent/50",
          ),
      )}
    >
      {children}
      <span className="mt-0.5 text-sm font-bold">{title}</span>
      {hint && <span className="text-xs leading-snug text-text-muted">{hint}</span>}
    </button>
  );
}

function LayoutDrawing({ layout }: { layout: ShelfLayout }) {
  const tones = [
    "var(--color-accent-start)",
    "var(--color-accent)",
    "var(--color-gold)",
    "var(--color-success)",
  ];
  const shapes: { w: number; h: number; lean?: boolean }[] =
    layout === "covers"
      ? [
          { w: 18, h: 27 },
          { w: 18, h: 27 },
          { w: 18, h: 27 },
        ]
      : layout === "stacks"
        ? [
            { w: 7, h: 34 },
            { w: 9, h: 30 },
            { w: 22, h: 8 },
            { w: 7, h: 32, lean: true },
          ]
        : [
            { w: 7, h: 34 },
            { w: 9, h: 30 },
            { w: 6, h: 36 },
            { w: 8, h: 32 },
            { w: 7, h: 28 },
          ];
  return (
    <span className="flex h-11 items-end gap-0.5 border-b-[3px] border-edge px-1">
      {shapes.map((shape, i) => (
        <span
          key={i}
          className="origin-bottom-left rounded-[2px]"
          style={{
            width: shape.w,
            height: shape.h,
            background: tones[i % tones.length],
            transform: shape.lean ? "rotate(-12deg)" : undefined,
          }}
        />
      ))}
    </span>
  );
}

function TabButton({
  active,
  expanded,
  onClick,
  children,
}: {
  active: boolean;
  expanded?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-expanded={expanded}
      onClick={onClick}
      className={cn(
        "flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 font-mono text-[11px] tracking-wider uppercase transition",
        active
          ? "border-accent bg-surface text-text"
          : "border-border text-text-muted hover:text-text",
      )}
    >
      {children}
    </button>
  );
}

/** A small drawing for each tab (stroke icons, like the app's). */
const TAB_ICONS: Record<Tab, ReactNode> = {
  Prontos: <path d="M12 3l2.2 5.6L20 9.5l-4.5 3.8L17 19l-5-3.2L7 19l1.5-5.7L4 9.5l5.8-.9z" />,
  Modelo: <path d="M5 3h14v18H5zM5 9h14M5 15h14" />,
  Cores: (
    <path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.6 0-.9-.6-1.4-.6-2.2 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3zM7.5 11.5h.01M10 7.5h.01M15 7.5h.01" />
  ),
  Lombadas: <path d="M5 4v16M9 4v16M13 6l4 14M4 20h16" />,
  Arrumar: <path d="M4 7h10M18 7h2M4 17h4M12 17h8M14 5v4M8 15v4" />,
  Enfeites: (
    <path d="M12 21v-7M12 14c-1-4-4-6-7-6 0 4 3 6 7 6zM12 14c1-5 4-8 8-8 0 5-3 8-8 8zM8 21h8" />
  ),
  Luz: (
    <path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
  ),
};

function TabIcon({ tab }: { tab: Tab }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5 shrink-0"
    >
      {TAB_ICONS[tab]}
    </svg>
  );
}
