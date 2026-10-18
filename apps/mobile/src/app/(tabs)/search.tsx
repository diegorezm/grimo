import { Screen, Text } from "@/components/ui";
import { BookSearch } from "@/features/books";

export default function SearchScreen() {
  return (
    <Screen>
      <Text variant="heading">Buscar livros</Text>
      <BookSearch />
    </Screen>
  );
}
