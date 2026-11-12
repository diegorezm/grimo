import type { ShelfItem } from "@grimo/client";
import { SHELF_LABELS } from "@grimo/core";
import { router } from "expo-router";
import { useEffect } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Stars, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { BookCover } from "@/features/books";
import { useTheme } from "@/hooks/use-theme";

const COVER = 150;

/**
 * Tapping a book takes it off the shelf: it turns from its spine to its cover and floats, with
 * where you are in it. "Abrir livro" goes to its page; tapping outside puts it back.
 */
export function BookPeek({ item, onClose }: { item: ShelfItem | null; onClose: () => void }) {
  const theme = useTheme();
  const reduce = useReducedMotion();
  const turn = useSharedValue(0);
  const float = useSharedValue(0);

  useEffect(() => {
    if (!item) return;
    if (reduce) {
      turn.value = 1;
      return;
    }
    turn.value = 0;
    float.value = 0;
    turn.value = withSpring(1, { damping: 14, stiffness: 90, reduceMotion: ReduceMotion.System });
    float.value = withDelay(
      900,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
  }, [item, reduce, turn, float]);

  const book = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { translateY: (1 - turn.value) * 60 - float.value * 8 },
      { rotateY: `${90 - turn.value * 112}deg` },
      { scale: 0.8 + turn.value * 0.2 },
    ],
  }));

  if (!item) return null;
  const { entry, book: info } = item;
  const pages = info.pageCount ?? null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityLabel="Guardar o livro"
        onPress={onClose}
        style={[styles.backdrop, { backgroundColor: theme.shadow }]}
      >
        <Animated.View style={[styles.book, book]}>
          <BookCover src={info.coverUrl} title={info.title} width={COVER} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(200).duration(380)}>
          <Pressable
            onPress={() => {}}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Text variant="label" color="textMuted">
              {SHELF_LABELS[entry.status]}
              {entry.status === "reading" && pages
                ? ` · página ${entry.currentPage} de ${pages}`
                : ""}
            </Text>
            <Text variant="heading" numberOfLines={3}>
              {info.title}
            </Text>
            <Text color="textMuted" numberOfLines={2}>
              {[info.authors.join(", "), pages ? `${pages} páginas` : null]
                .filter(Boolean)
                .join(" · ")}
            </Text>
            {entry.rating !== null && (
              <Animated.View entering={FadeIn.delay(450)}>
                <Stars value={entry.rating} />
              </Animated.View>
            )}
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                style={({ pressed }) => [
                  styles.action,
                  { borderWidth: 1.5, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text variant="label">Guardar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  onClose();
                  router.push({ pathname: "/book/[id]", params: { id: info.openLibraryId } });
                }}
                style={({ pressed }) => [
                  styles.action,
                  {
                    backgroundImage: `linear-gradient(135deg, ${theme.accentStart} 0%, ${theme.accent} 100%)`,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text variant="label" color="accentForeground">
                  Abrir livro
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing[6] },
  book: { boxShadow: "0 24px 40px rgba(0,0,0,0.35)" },
  card: {
    width: 330,
    padding: spacing[5],
    gap: spacing[2],
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  actions: { flexDirection: "row", gap: spacing[3], marginTop: spacing[2] },
  action: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
