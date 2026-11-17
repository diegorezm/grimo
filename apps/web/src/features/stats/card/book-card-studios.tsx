import { useCardStudioStore, useFinishedCard, useQuoteCard } from "@grimo/client";
import { FINISHED_CARD_TEMPLATE_LABELS, FINISHED_CARD_TEMPLATES } from "@grimo/core";
import { Spinner } from "@/components/feedback/spinner";
import { cn } from "@/utils/cn";
import { BookStoryCard } from "./book-story-card";
import { FINISHED_CARD_COMPONENTS } from "./finished";
import { PaletteStudio } from "./palette-studio";
import { StoryCanvas } from "./story-canvas";

/** "Terminei de ler" for Stories; only for a book on your "Lidos" shelf. */
export function FinishedCardStudio({ openLibraryId }: { openLibraryId: string }) {
  const data = useFinishedCard(openLibraryId);
  const studio = useCardStudioStore();
  if (!data) return <Spinner />;

  return (
    <PaletteStudio
      fileName={`grimo-terminei-${studio.bookTemplate}.png`}
      shareTitle={`Terminei de ler ${data.book.title}`}
      note="Sua nota, sensações e trilha vêm da página e do diário do livro."
      beforeColors={(palette) => (
        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted">
            Modelo
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {FINISHED_CARD_TEMPLATES.map((template) => {
              const Thumb = FINISHED_CARD_COMPONENTS[template];
              const active = template === studio.bookTemplate;
              return (
                <button
                  key={template}
                  type="button"
                  aria-pressed={active}
                  onClick={() => studio.set({ bookTemplate: template })}
                  className={cn(
                    "flex flex-col items-center gap-2.5 rounded-lg border p-2.5 text-center transition",
                    active
                      ? "border-accent bg-surface-muted"
                      : "border-border hover:bg-surface-muted/60",
                  )}
                >
                  <StoryCanvas
                    scale={0.095}
                    className="pointer-events-none rounded-md shadow-md shadow-shadow"
                  >
                    <Thumb data={data} palette={palette} showDetails={studio.showBookDetails} />
                  </StoryCanvas>
                  <span>
                    <span className="block font-serif text-sm font-medium">
                      {FINISHED_CARD_TEMPLATE_LABELS[template].label}
                    </span>
                    <span className="block text-[11px] leading-tight text-text-muted">
                      {FINISHED_CARD_TEMPLATE_LABELS[template].description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}
      afterColors={
        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted">
            Detalhes
          </h2>
          <label className="flex w-fit cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={studio.showBookDetails}
              onChange={(e) => studio.set({ showBookDetails: e.target.checked })}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className="relative h-6 w-11 rounded-full bg-surface-muted transition peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40 after:absolute after:top-1 after:left-1 after:size-4 after:rounded-full after:bg-surface after:shadow after:transition peer-checked:after:translate-x-5"
            />
            <span className="text-sm">Mostrar resenha, sensações e ritmo</span>
          </label>
        </section>
      }
    >
      {(palette) => (
        <BookStoryCard
          data={data}
          palette={palette}
          template={studio.bookTemplate}
          showDetails={studio.showBookDetails}
        />
      )}
    </PaletteStudio>
  );
}

/** A quote for Stories, with its page and the book. */
export function QuoteCardStudio({ postId }: { postId: string }) {
  const data = useQuoteCard(postId);
  if (!data) return <Spinner />;
  return (
    <PaletteStudio fileName="grimo-citacao.png" shareTitle={`Uma citação de ${data.book.title}`}>
      {(palette) => <BookStoryCard data={data} palette={palette} />}
    </PaletteStudio>
  );
}
