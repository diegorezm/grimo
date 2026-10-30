import { useFinishedCard, useQuoteCard } from "@grimo/client";
import { Spinner } from "@/components/feedback/spinner";
import { BookStoryCard } from "./book-story-card";
import { PaletteStudio } from "./palette-studio";

/** "Terminei de ler" for Stories; only for a book on your "Lidos" shelf. */
export function FinishedCardStudio({ openLibraryId }: { openLibraryId: string }) {
  const data = useFinishedCard(openLibraryId);
  if (!data) return <Spinner />;
  return (
    <PaletteStudio
      fileName="grimo-terminei.png"
      shareTitle={`Terminei de ler ${data.book.title}`}
      note="Sua nota aparece em estrelas. Mude a nota na página do livro."
    >
      {(palette) => <BookStoryCard data={data} palette={palette} />}
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
