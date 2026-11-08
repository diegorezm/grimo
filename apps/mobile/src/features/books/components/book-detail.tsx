import {
  bookInputOf,
  toast,
  useAddToShelf,
  useBook,
  useRemoveFromShelf,
  useUpdateShelfEntry,
} from "@grimo/client";
import {
  editionPages,
  type Feeling,
  feelingsSavedMessage,
  formatRating,
  ratingSavedMessage,
  readingPercent,
  SHELF_LABELS,
  SHELF_STATUSES,
  type ShelfStatus,
  shelfMoveMessage,
  starShares,
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
  FeelingPicker,
  FeelingTags,
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
import { EntryTags } from "./entry-tags";
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

  const { book, entry, community, reviews, quotes, friendsWant, diary } = data;
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
        {entry && <EntryTags entryId={entry.id} />}
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
                pageCount={pages}
                book={{ ...book, id: book.id }}
              />
            )}
          </Card>
        )}

        {(entry?.status === "read" || entry?.status === "abandoned") && (
          <>
            <RatingCard
              entryId={entry.id}
              rating={entry.rating}
              feelings={entry.feelings}
              suggested={diary.suggested}
            />
            {entry.status === "read" && (
              <Button
                variant="secondary"
                title="Card de “terminei” para os Stories"
                onPress={() =>
                  router.push({ pathname: "/book-card/[id]", params: { id: openLibraryId } })
                }
              />
            )}
          </>
        )}
        <Diary marks={diary.marks} />

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

        <CommunityFeelings community={community} />

        <View style={styles.section}>
          <View style={styles.between}>
            <Text variant="heading">Resenhas</Text>
            <Text variant="label" color="textMuted">
              {community.averageRating ? `★ ${formatRating(community.averageRating)} · ` : ""}
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

  const openFinish = () =>
    router.push({ pathname: "/finish/[id]", params: { id: book.openLibraryId } });

  function pick(status: ShelfStatus) {
    if (entry?.status === status) return;
    // Finishing a book is a moment: the sheet asks for the date, the rating and the feelings.
    if (status === "read" && entry) return openFinish();
    if (entry) {
      const previous = entry.status;
      const move = (to: ShelfStatus) =>
        update.mutate(
          { id: entry.id, status: to },
          { onError: (error) => toast.failed(error, () => move(to)) },
        );
      move(status);
      toast.saved(shelfMoveMessage(book.title, status), {
        label: "Desfazer",
        run: () => move(previous),
      });
      return;
    }
    const add = () =>
      addToShelf.mutate(
        { book: bookInputOf(book), status },
        {
          onSuccess: () => {
            if (status === "read") return openFinish();
            toast.saved(shelfMoveMessage(book.title, status));
          },
          onError: (error) => toast.failed(error, add),
        },
      );
    add();
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

/** Your rating: half stars and the feelings the book left (the diary suggests them). */
function RatingCard({
  entryId,
  rating,
  feelings,
  suggested,
}: {
  entryId: string;
  rating: number | null;
  feelings: Feeling[];
  suggested: Feeling[];
}) {
  const update = useUpdateShelfEntry();
  const rate = (value: number | null) =>
    update.mutate(
      { id: entryId, rating: value },
      {
        onSuccess: () => toast.saved(ratingSavedMessage(value)),
        onError: (error) => toast.failed(error, () => rate(value)),
      },
    );
  const feel = (next: Feeling[]) =>
    update.mutate(
      { id: entryId, feelings: next },
      {
        onSuccess: () => toast.saved(feelingsSavedMessage(next)),
        onError: (error) => toast.failed(error, () => feel(next)),
      },
    );
  return (
    <Card>
      <View style={styles.centerCard}>
        <Text variant="label" color="textMuted">
          Sua nota{rating !== null ? ` · ${formatRating(rating)}` : ""}
        </Text>
        <Stars value={rating} size={32} onChange={rate} />
      </View>
      <FeelingPicker value={feelings} suggested={suggested} onChange={feel} />
    </Card>
  );
}

/** The pages where you said how you felt: the diary your rating's feelings come from. */
function Diary({ marks }: { marks: Detail["diary"]["marks"] }) {
  const [open, setOpen] = useState(false);
  if (marks.length === 0) return null;
  return (
    <Card>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={styles.between}
      >
        <Text variant="label" color="textMuted">
          Seu diário de leitura · {marks.length} {marks.length === 1 ? "página" : "páginas"}
        </Text>
        <Text variant="label" color="textMuted">
          {open ? "−" : "+"}
        </Text>
      </Pressable>
      {open &&
        marks.map((mark) => (
          <View key={mark.at} style={styles.diaryRow}>
            <Text variant="label" color="textMuted" style={styles.diaryPage}>
              p. {mark.page}
            </Text>
            <View style={styles.grow}>
              <FeelingTags feelings={mark.feelings} />
            </View>
          </View>
        ))}
    </Card>
  );
}

/** "Como os leitores se sentiram" and the star bars, once someone rated or felt the book. */
function CommunityFeelings({ community }: { community: Detail["community"] }) {
  if (community.ratings === 0 && community.feelings.length === 0) return null;
  return (
    <View style={styles.section}>
      {community.feelings.length > 0 && (
        <Card>
          <Text variant="title">Como os leitores se sentiram</Text>
          {community.feelings.map((row) => (
            <BarRow
              key={row.feeling}
              label={row.label}
              percent={row.percent}
              end={`${row.percent}%`}
            />
          ))}
          <Text variant="label" color="textMuted">
            De {community.feelingReaders}{" "}
            {community.feelingReaders === 1 ? "leitor que contou" : "leitores que contaram"}
          </Text>
        </Card>
      )}
      {community.ratings > 0 && (
        <Card>
          <Text variant="title">
            Notas · ★ {formatRating(community.averageRating ?? 0)} ({community.ratings})
          </Text>
          {starShares(community.stars).map((bar) => (
            <BarRow
              key={bar.star}
              label={`${bar.star} ★`}
              percent={bar.percent}
              end={String(bar.count)}
              gold
            />
          ))}
        </Card>
      )}
    </View>
  );
}

function BarRow({
  label,
  percent,
  end,
  gold = false,
}: {
  label: string;
  percent: number;
  end: string;
  gold?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.barRow}>
      <Text variant="small" style={styles.barLabel} color={gold ? "gold" : "text"}>
        {label}
      </Text>
      <View style={[styles.barTrack, { backgroundColor: theme.surfaceMuted }]}>
        <View
          style={[
            styles.barFill,
            { width: `${percent}%`, backgroundColor: gold ? theme.gold : theme.accent },
          ]}
        />
      </View>
      <Text variant="label" color="textMuted" style={styles.barEnd}>
        {end}
      </Text>
    </View>
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
        {
          text: "Tirar",
          style: "destructive",
          onPress: () => {
            remove.mutate(entryId, { onError: (error) => toast.failed(error) });
            toast.saved(`${title} saiu da sua estante`);
          },
        },
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
      {review.rating !== null ? <Stars value={review.rating} size={14} /> : null}
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
  diaryRow: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  diaryPage: { width: 56 },
  barRow: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  barLabel: { width: 96 },
  barTrack: { flex: 1, height: 8, borderRadius: radius.full, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: radius.full },
  barEnd: { width: 40, textAlign: "right" },
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
