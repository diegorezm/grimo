import {
  bookInputOf,
  useAddToShelf,
  useBook,
  useRemoveFromShelf,
  useUpdateShelfEntry,
} from "@grimo/client";
import {
  editionPages,
  readingPercent,
  SHELF_LABELS,
  SHELF_STATUSES,
  type ShelfStatus,
  timeAgo,
} from "@grimo/core";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Avatar,
  Button,
  Card,
  Glass,
  MentionText,
  ProgressBar,
  Stars,
  Text,
} from "@/components/ui";
import { radius, shelfBadges, spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { BookCover } from "./book-cover";
import { FriendsWant } from "./friends-want";
import { OpenReads } from "./open-reads";
import { QuoteText } from "./quote-text";
import { SessionControl } from "./session-control";
import { StartGroup } from "./start-group";

/** Book page: cover, shelf picker, progress / rating, synopsis and reviews. */
export function BookDetail({ openLibraryId }: { openLibraryId: string }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { data, isPending, isError } = useBook(openLibraryId);

  if (isPending) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }
  if (isError || !data) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text color="textMuted">Não encontramos este livro.</Text>
        <Button variant="secondary" title="Voltar" onPress={() => router.back()} />
      </View>
    );
  }

  const { book, entry, community, reviews, quotes, friendsWant } = data;
  const pages = editionPages(entry?.pageCount, book.pageCount);
  const bookInput = bookInputOf(book);
  const percent = entry ? readingPercent(entry.currentPage, pages) : null;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 64 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <BookCover src={book.coverUrl} title={book.title} width={140} />
          <Text variant="display" style={styles.center} numberOfLines={3}>
            {book.title}
          </Text>
          <Text color="accent" style={styles.center}>
            {book.authors.join(", ")}
          </Text>
          <Text variant="label" color="textMuted">
            {[book.pageCount && `${book.pageCount} págs`, book.publishedYear]
              .filter(Boolean)
              .join(" · ")}
          </Text>
          <FriendsWant friends={friendsWant} />
          {book.reviewStatus === "pending" && (
            <Text variant="small" color="textMuted" style={styles.center}>
              Em revisão: você cadastrou este livro, só você o vê até a revisão.
            </Text>
          )}
          {book.reviewStatus === "rejected" && (
            <Text variant="small" color="textMuted" style={styles.center}>
              Este cadastro não foi aprovado: o livro continua só na sua estante.
            </Text>
          )}
        </View>

        <ShelfPicker book={book} entry={entry} />
        {book.id && (
          <Button
            variant="ghost"
            title="Adicionar a uma lista"
            onPress={() =>
              router.push({ pathname: "/add-to-list/[id]", params: { id: openLibraryId } })
            }
          />
        )}

        {entry?.status === "reading" && (
          <Card>
            <View style={styles.between}>
              <Text variant="label" color="textMuted">
                Página {entry.currentPage}
                {pages ? ` de ${pages}` : ""}
                {entry.pageCount ? " (sua edição)" : ""}
              </Text>
              {percent !== null && <Text variant="label">{percent}%</Text>}
            </View>
            {percent !== null && <ProgressBar percent={percent} />}
            <Button
              title="Atualizar progresso"
              onPress={() =>
                router.push({ pathname: "/progress/[id]", params: { id: openLibraryId } })
              }
            />
            {book.id && (
              <SessionControl
                entryId={entry.id}
                page={entry.currentPage}
                book={{ ...book, id: book.id }}
              />
            )}
          </Card>
        )}

        {entry?.status === "read" && (
          <>
            <RatingCard entryId={entry.id} rating={entry.rating} />
            <Button
              variant="secondary"
              title="Card de “terminei” para os Stories"
              onPress={() =>
                router.push({ pathname: "/book-card/[id]", params: { id: openLibraryId } })
              }
            />
          </>
        )}

        {(book.reviewStatus === null || book.reviewStatus === "approved") && (
          <StartGroup book={bookInput} />
        )}
        {(book.reviewStatus === null || book.reviewStatus === "approved") && (
          <OpenReads openLibraryId={openLibraryId} />
        )}

        {entry && <RemoveFromShelf entryId={entry.id} title={book.title} />}

        {book.description && (
          <Card>
            <Text variant="label" color="textMuted">
              Sinopse
            </Text>
            <Text>{book.description}</Text>
          </Card>
        )}

        <View style={styles.section}>
          <View style={styles.between}>
            <Text variant="heading">Resenhas</Text>
            <Text variant="label" color="textMuted">
              {community.averageRating ? `★ ${community.averageRating} · ` : ""}
              {community.readers} leitores
            </Text>
          </View>
          {book.id && entry && (
            <Button
              variant="secondary"
              title="Escrever resenha"
              onPress={() =>
                router.push({ pathname: "/review/[id]", params: { id: openLibraryId } })
              }
            />
          )}
          {reviews.length === 0 && (
            <Text color="textMuted">Ninguém resenhou este livro ainda.</Text>
          )}
          {reviews.map((review) => (
            <Review key={review.id} review={review} />
          ))}
        </View>

        <View style={styles.section}>
          <Text variant="heading">Citações</Text>
          {book.id && entry && (
            <Button
              variant="secondary"
              title="Guardar citação"
              onPress={() =>
                router.push({ pathname: "/quote/[id]", params: { id: openLibraryId } })
              }
            />
          )}
          {quotes.length === 0 && (
            <Text color="textMuted">Ninguém guardou um trecho deste livro ainda.</Text>
          )}
          {quotes.map((quote) => (
            <Card key={quote.id}>
              <QuoteText body={quote.body} page={quote.page} />
              <View style={styles.between}>
                <Text variant="small" color="textMuted" style={styles.grow}>
                  {quote.author.name} · {timeAgo(new Date(quote.createdAt))}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Card da citação para os Stories"
                  onPress={() =>
                    router.push({ pathname: "/quote-card/[id]", params: { id: quote.id } })
                  }
                  hitSlop={8}
                >
                  <Text variant="label" color="accent">
                    Card
                  </Text>
                </Pressable>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.topBar, { top: insets.top + spacing[2] }]}>
        <Glass interactive style={styles.round}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={() => router.back()}
            style={styles.roundTouch}
          >
            <Text style={styles.chevron}>‹</Text>
          </Pressable>
        </Glass>
      </View>
    </View>
  );
}

type Detail = NonNullable<ReturnType<typeof useBook>["data"]>;

function ShelfPicker({ book, entry }: { book: Detail["book"]; entry: Detail["entry"] }) {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const addToShelf = useAddToShelf();
  const update = useUpdateShelfEntry();
  const busy = addToShelf.isPending || update.isPending;

  function pick(status: ShelfStatus) {
    if (entry) return update.mutate({ id: entry.id, status });
    const input = bookInputOf(book);
    addToShelf.mutate({ book: input, status });
  }

  return (
    <Glass style={styles.picker}>
      {SHELF_STATUSES.map((status) => {
        const badge = shelfBadges[scheme][status];
        const active = entry?.status === status;
        return (
          <Pressable
            key={status}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled: busy }}
            disabled={busy}
            onPress={() => pick(status)}
            style={[styles.pill, active && { backgroundColor: badge.bg, borderColor: badge.fg }]}
          >
            <Text
              variant="label"
              numberOfLines={1}
              style={{ color: active ? badge.fg : undefined }}
            >
              {SHELF_LABELS[status]}
            </Text>
          </Pressable>
        );
      })}
    </Glass>
  );
}

function RatingCard({ entryId, rating }: { entryId: string; rating: number | null }) {
  const update = useUpdateShelfEntry();
  return (
    <Card style={styles.centerCard}>
      <Text variant="label" color="textMuted">
        Sua nota
      </Text>
      <Stars
        value={rating}
        size={30}
        onChange={(value) => update.mutate({ id: entryId, rating: value })}
      />
    </Card>
  );
}

/** Takes the book off your shelves (and its page log); confirmed first. */
function RemoveFromShelf({ entryId, title }: { entryId: string; title: string }) {
  const remove = useRemoveFromShelf();
  function confirm() {
    Alert.alert(
      "Tirar da estante?",
      `${title} sai das suas estantes, com o histórico de páginas. Suas resenhas continuam.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Tirar", style: "destructive", onPress: () => remove.mutate(entryId) },
      ],
    );
  }
  return (
    <Button
      variant="ghost"
      title="Tirar da estante"
      disabled={remove.isPending}
      onPress={confirm}
    />
  );
}

function Review({ review }: { review: Detail["reviews"][number] }) {
  const [revealed, setRevealed] = useState(!review.hasSpoilers);
  return (
    <Card>
      <View style={styles.between}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Perfil de ${review.author.name}`}
          onPress={() =>
            router.push({
              pathname: "/u/[username]",
              params: { username: review.author.username },
            })
          }
          style={styles.author}
        >
          <Avatar image={review.author.image} name={review.author.name} size={28} />
          <Text style={styles.bold}>{review.author.name}</Text>
        </Pressable>
        <Text variant="label" color="textMuted">
          {timeAgo(new Date(review.createdAt))}
        </Text>
      </View>
      {review.rating ? <Stars value={review.rating} size={14} /> : null}
      {revealed ? (
        <MentionText text={review.body} />
      ) : (
        <Pressable accessibilityRole="button" onPress={() => setRevealed(true)}>
          <Text color="textMuted">Contém spoiler · toque para ver</Text>
        </Pressable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing[4], gap: spacing[4], paddingBottom: spacing[12] },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
    textAlign: "center",
  },
  hero: { alignItems: "center", gap: spacing[2] },
  between: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  grow: { flex: 1 },
  section: { gap: spacing[3] },
  centerCard: { alignItems: "center" },
  bold: { fontWeight: "700" },
  author: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  picker: { flexDirection: "row", padding: spacing[1], gap: spacing[1], borderRadius: radius.xl },
  pill: {
    flex: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: "transparent",
    paddingHorizontal: 2,
  },
  topBar: { position: "absolute", left: spacing[4] },
  round: { width: 44, height: 44, borderRadius: radius.full },
  roundTouch: { flex: 1, alignItems: "center", justifyContent: "center" },
  chevron: { fontSize: 30, lineHeight: 32, marginTop: -2 },
});
