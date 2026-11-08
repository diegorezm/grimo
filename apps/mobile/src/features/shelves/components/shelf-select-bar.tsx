import {
  type MyShelf,
  toast,
  useMoveBooks,
  useMyShelves,
  useSetShelfBooks,
  useShelfScreenStore,
} from "@grimo/client";
import { MAX_BULK_BOOKS } from "@grimo/core";
import { Alert, StyleSheet, View } from "react-native";
import { Button, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const books = (n: number) => `${n} ${n === 1 ? "livro" : "livros"}`;

/**
 * What to do with the picked books: add them to a shelf, move them, take them off this shelf,
 * or make a new shelf with them. While picking for an empty shelf, just "Adicionar".
 */
export function ShelfSelectBar({
  current,
  picking,
  onNewShelf,
}: {
  /** The shelf on screen (null: every book). */
  current: MyShelf | null;
  /** Picking books for this (empty) shelf. */
  picking: MyShelf | null;
  onNewShelf: (entryIds: string[]) => void;
}) {
  const theme = useTheme();
  const shelves = useMyShelves().data?.items ?? [];
  const setBooks = useSetShelfBooks();
  const move = useMoveBooks();
  const { selected, setSelecting, openShelf } = useShelfScreenStore();

  function ready() {
    if (selected.length === 0) {
      toast.info("Toque nos livros para escolher.");
      return false;
    }
    if (selected.length > MAX_BULK_BOOKS) {
      toast.info(`Escolha até ${MAX_BULK_BOOKS} livros de uma vez.`);
      return false;
    }
    return true;
  }

  function add(target: MyShelf, then?: () => void) {
    const entryIds = [...selected];
    setBooks.mutate(
      { shelfId: target.id, entryIds, on: true },
      { onError: (error) => toast.failed(error) },
    );
    toast.saved(`${books(entryIds.length)} na estante ${target.name}`, {
      label: "Desfazer",
      run: () => setBooks.mutate({ shelfId: target.id, entryIds, on: false }),
    });
    setSelecting(false);
    then?.();
  }

  /** "Adicionar a…" / "Mover para…": pick the shelf, or make a new one. */
  function chooseShelf(action: "add" | "move") {
    if (!ready()) return;
    const targets = shelves.filter((shelf) => shelf.id !== current?.id);
    Alert.alert(action === "add" ? "Adicionar a…" : "Mover para…", books(selected.length), [
      ...targets.map((target) => ({
        text: target.name,
        onPress: () => {
          if (action === "add" || !current) return add(target);
          const entryIds = [...selected];
          move.mutate(
            { fromId: current.id, toId: target.id, entryIds },
            { onError: (error) => toast.failed(error) },
          );
          toast.saved(`${books(entryIds.length)} movidos para ${target.name}`, {
            label: "Desfazer",
            run: () => move.mutate({ fromId: target.id, toId: current.id, entryIds }),
          });
          setSelecting(false);
        },
      })),
      { text: "Nova estante…", onPress: () => onNewShelf([...selected]) },
      { text: "Cancelar", style: "cancel" as const },
    ]);
  }

  function takeOff() {
    if (!current || !ready()) return;
    const entryIds = [...selected];
    setBooks.mutate(
      { shelfId: current.id, entryIds, on: false },
      { onError: (error) => toast.failed(error) },
    );
    toast.saved(`${books(entryIds.length)} fora da estante ${current.name}`, {
      label: "Desfazer",
      run: () => setBooks.mutate({ shelfId: current.id, entryIds, on: true }),
    });
    setSelecting(false);
  }

  return (
    <View style={[styles.bar, { backgroundColor: theme.surface, borderColor: theme.edge }]}>
      <Text variant="label">
        {selected.length} {selected.length === 1 ? "escolhido" : "escolhidos"}
      </Text>
      {picking ? (
        <View style={styles.actions}>
          <Button variant="ghost" title="Cancelar" onPress={() => openShelf(picking.id)} />
          <Button
            title={`Adicionar a ${picking.name}`}
            onPress={() => ready() && add(picking, () => openShelf(picking.id))}
          />
        </View>
      ) : (
        <View style={styles.grid}>
          <Button title="Adicionar a…" onPress={() => chooseShelf("add")} />
          {current && (
            <Button variant="secondary" title="Mover para…" onPress={() => chooseShelf("move")} />
          )}
          {current && <Button variant="secondary" title="Tirar desta estante" onPress={takeOff} />}
          <Button
            variant="secondary"
            title="Nova estante com estes"
            onPress={() => ready() && onNewShelf([...selected])}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderWidth: 1, borderRadius: radius.lg, padding: spacing[3], gap: spacing[3] },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing[2] },
  grid: { gap: spacing[2] },
});
