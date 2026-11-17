import { useCardStudioStore, useFinishedCard, useQuoteCard } from "@grimo/client";
import { FINISHED_CARD_TEMPLATE_LABELS, FINISHED_CARD_TEMPLATES } from "@grimo/core";
import { Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { BookStoryCard } from "./book-story-card";
import { FINISHED_CARD_COMPONENTS } from "./finished";
import { PaletteStudio } from "./palette-studio";
import { StoryCanvas } from "./story-canvas";

/** "Terminei de ler" for Stories; only for a book on your "Lidos" shelf. */
export function FinishedCardStudio({ openLibraryId }: { openLibraryId: string }) {
  const theme = useTheme();
  const data = useFinishedCard(openLibraryId);
  const studio = useCardStudioStore();

  return (
    <PaletteStudio
      title="Terminei de ler"
      note="Sua nota, sensações e trilha vêm da página e do diário do livro."
      shareTitle={data ? `Terminei de ler ${data.book.title}` : "Terminei de ler"}
      beforeColors={
        data
          ? (palette) => (
              <View style={styles.section}>
                <Text variant="label" color="textMuted">
                  Modelo
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.row}
                >
                  {FINISHED_CARD_TEMPLATES.map((template) => {
                    const Thumb = FINISHED_CARD_COMPONENTS[template];
                    const active = template === studio.bookTemplate;
                    return (
                      <Pressable
                        key={template}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={FINISHED_CARD_TEMPLATE_LABELS[template].label}
                        onPress={() => studio.set({ bookTemplate: template })}
                        style={[
                          styles.template,
                          { borderColor: active ? theme.accent : theme.border },
                          active && { backgroundColor: theme.surfaceMuted },
                        ]}
                      >
                        <StoryCanvas scale={0.1} style={styles.thumb}>
                          <Thumb
                            data={data}
                            palette={palette}
                            showDetails={studio.showBookDetails}
                          />
                        </StoryCanvas>
                        <Text variant="title">{FINISHED_CARD_TEMPLATE_LABELS[template].label}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )
          : undefined
      }
      afterColors={
        <View style={styles.toggle}>
          <Text>Mostrar resenha, sensações e ritmo</Text>
          <Switch
            value={studio.showBookDetails}
            onValueChange={(showBookDetails) => studio.set({ showBookDetails })}
            trackColor={{ false: theme.surfaceMuted, true: theme.accent }}
          />
        </View>
      }
    >
      {data &&
        ((palette) => (
          <BookStoryCard
            data={data}
            palette={palette}
            template={studio.bookTemplate}
            showDetails={studio.showBookDetails}
          />
        ))}
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

const styles = StyleSheet.create({
  section: { gap: spacing[3] },
  row: { gap: spacing[3] },
  template: {
    alignItems: "center",
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
  },
  thumb: { borderRadius: radius.sm },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
    paddingVertical: spacing[1],
  },
});
