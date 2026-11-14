import {
  type MyShelf,
  toast,
  useMoveBooks,
  useMyShelves,
  useSetShelfBooks,
  useShelfScreenStore,
} from "@grimo/client";
import { MAX_BULK_BOOKS } from "@grimo/core";
import type { ReactNode } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Button, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { useShelfNaming } from "@/features/books";
import { useTheme } from "@/hooks/use-theme";

const books = (n: number) => `${n} ${n === 1 ? "livro" : "livros"}`;

/**
 * Select mode's actions, floating above the tab bar: add the picked books to a shelf, move
 * them, take them off this shelf, or make a new shelf with them. While picking for an empty
 * shelf, just "Adicionar a …". Rendered by the screen, outside its scroll.
 */
export function ShelfSelectBar() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const shelves = useMyShelves().data?.items ?? [];
  const setBooks = useSetShelfBooks();
  const move = useMoveBooks();
  const naming = useShelfNaming();
  const { selecting, selected, shelfId, pickingFor, setSelecting, openShelf } =
    useShelfScreenStore();
  if (!selecting) return null;
  const current = shelves.find((shelf) => shelf.id === shelfId) ?? null;
  const picking = shelves.find((shelf) => shelf.id === pickingFor) ?? null;

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

  function newShelf() {
    if (!ready()) return;
    naming.askNew([...selected], (id) => openShelf(id));
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
      { text: "Nova estante…", onPress: newShelf },
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
    <View
      style={[
        styles.bar,
        {
          bottom: insets.bottom + 64,
          backgroundColor: theme.surface,
          borderColor: theme.edge,
          shadowColor: theme.shadow,
        },
      ]}
    >
      {picking ? (
        <Button
          title={`Adicionar a ${picking.name}`}
          onPress={() => ready() && add(picking, () => openShelf(picking.id))}
        />
      ) : (
        <View style={styles.actions}>
          <Action label="Adicionar a…" onPress={() => chooseShelf("add")}>
            <Path d="M12 5v14M5 12h14" />
          </Action>
          {current && (
            <Action label="Mover para…" onPress={() => chooseShelf("move")}>
              <Path d="M5 12h14M13 6l6 6-6 6" />
            </Action>
          )}
          {current && (
            <Action label="Tirar daqui" onPress={takeOff}>
              <Path d="M5 12h14" />
            </Action>
          )}
          <Action label="Nova estante" onPress={newShelf}>
            <Path d="M4 7h16v12H4zM9 3h6v4" />
          </Action>
        </View>
      )}
      {naming.dialog}
    </View>
  );
}

function Action({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Svg
        width={22}
        height={22}
        viewBox="0 0 24 24"
        fill="none"
        stroke={theme.text}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </Svg>
      <Text variant="small" numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: spacing[4],
    right: spacing[4],
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing[2],
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  actions: { flexDirection: "row" },
  action: { flex: 1, alignItems: "center", gap: spacing[1], paddingVertical: spacing[2] },
});
