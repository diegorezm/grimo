import { useFinishedCard, useQuoteCard } from "@grimo/client";
import { BookStoryCard } from "./book-story-card";
import { PaletteStudio } from "./palette-studio";

/** "Terminei de ler" for Stories; only for a book on your "Lidos" shelf. */
export function FinishedCardStudio({ openLibraryId }: { openLibraryId: string }) {
  const data = useFinishedCard(openLibraryId);
  return (
    <PaletteStudio
      title="Terminei de ler"
      note="Sua nota aparece em estrelas. Mude a nota na página do livro."
      shareTitle={data ? `Terminei de ler ${data.book.title}` : "Terminei de ler"}
    >
      {data && ((palette) => <BookStoryCard data={data} palette={palette} />)}
    </PaletteStudio>
  );
}

/** A quote for Stories, with its page and the book. */
export function QuoteCardStudio({ postId }: { postId: string }) {
  const data = useQuoteCard(postId);
  return (
    <PaletteStudio
      title="Card da citação"
      shareTitle={data ? `Uma citação de ${data.book.title}` : "Uma citação"}
    >
      {data && ((palette) => <BookStoryCard data={data} palette={palette} />)}
    </PaletteStudio>
  );
}
