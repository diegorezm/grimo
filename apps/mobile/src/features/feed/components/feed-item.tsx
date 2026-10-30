import {
  type FeedItem as FeedItemData,
  useMe,
  useSetBlocked,
  useShelveFromFeed,
  useToggleUpdateLike,
  useUpdateThread,
} from "@grimo/client";
import {
  activityProgress,
  commentCountLabel,
  feedHeadline,
  SHELF_LABELS,
  type ShelfStatus,
  timeAgo,
} from "@grimo/core";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Avatar, Card, MentionText, ProgressBar, Stars, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { BookCover, QuoteText } from "@/features/books";
import { showPostActions } from "@/features/moderation";
import { useTheme } from "@/hooks/use-theme";

/** Covers shown for a grouped entry before "+N". */
const MAX_COVERS = 5;

/** Updates readers can like and comment on (follows can't). */
const REACTABLE = new Set<FeedItemData["kind"]>(["shelved", "progress", "finished", "posted"]);

/**
 * One activity as a card: who did what, the book with a big cover and what it means for the
 * book (progress bar, stars, shelf), "Quero ler" for books you don't have, and the post. `more`
 * are older activities grouped into this one (see `groupActivities`).
 */
export function FeedItem({ item, more = [] }: { item: FeedItemData; more?: FeedItemData[] }) {
  const toggleLike = useToggleUpdateLike();
  const thread = useUpdateThread();
  const setBlocked = useSetBlocked();
  const theme = useTheme();
  const me = useMe().data;
  const { actor, book, post, reading } = item;
  const mine = me?.id === actor.id;
  const openLibraryId = book?.openLibraryId;
  const openBook = (id: string) => router.push({ pathname: "/book/[id]", params: { id } });
  const openThread = (id: string) => router.push({ pathname: "/post/[id]", params: { id } });
  // Progress groups show only the latest page; shelf and finished groups list every book.
  const books =
    more.length > 0 && item.kind !== "progress"
      ? [item, ...more].flatMap(({ book }) =>
          book?.title && book.openLibraryId
            ? [{ ...book, title: book.title, openLibraryId: book.openLibraryId }]
            : [],
        )
      : [];

  return (
    <Card>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Perfil de ${actor.name}`}
        onPress={() =>
          router.push({ pathname: "/u/[username]", params: { username: actor.username } })
        }
        style={styles.head}
      >
        <Avatar image={actor.image} name={actor.name} />
        <Text variant="small" style={styles.flex}>
          <Text variant="small" style={styles.bold}>
            {actor.name}
          </Text>{" "}
          <Text variant="small" color="textMuted">
            {feedHeadline(item.kind, item.data, books.length || 1)}
          </Text>
          {item.target?.name && (
            <Text variant="small" style={styles.bold}>
              {" "}
              {item.target.name}
            </Text>
          )}
        </Text>
        <Text variant="label" color="textMuted">
          {timeAgo(new Date(item.createdAt))}
        </Text>
      </Pressable>

      {books.length > 0 ? (
        <View style={styles.covers}>
          {books.slice(0, MAX_COVERS).map((b) => (
            <Pressable
              key={b.openLibraryId}
              accessibilityRole="button"
              accessibilityLabel={b.title}
              onPress={() => openBook(b.openLibraryId)}
            >
              <BookCover src={b.coverUrl} title={b.title} width={52} />
            </Pressable>
          ))}
          {books.length > MAX_COVERS && (
            <View style={[styles.more, { backgroundColor: theme.surfaceMuted }]}>
              <Text variant="label" color="textMuted">
                +{books.length - MAX_COVERS}
              </Text>
            </View>
          )}
        </View>
      ) : (
        book?.title &&
        openLibraryId && (
          <View style={styles.book}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={book.title}
              onPress={() => openBook(openLibraryId)}
            >
              <BookCover src={book.coverUrl} title={book.title} width={72} />
            </Pressable>
            <View style={[styles.flex, styles.bookInfo]}>
              <Pressable accessibilityRole="button" onPress={() => openBook(openLibraryId)}>
                <Text variant="title" numberOfLines={2}>
                  {book.title}
                </Text>
              </Pressable>
              <Text variant="small" color="textMuted" numberOfLines={1}>
                {book.authors?.join(", ")}
              </Text>
              <BookDetail item={item} />
              {me && !mine && reading && (
                <ShelfAction
                  book={{ ...book, title: book.title, openLibraryId }}
                  status={reading.viewerStatus}
                />
              )}
            </View>
          </View>
        )
      )}

      {post?.kind === "quote" ? (
        <QuoteText body={post.body} page={post.page} />
      ) : post?.body ? (
        <MentionText
          style={styles.quote}
          numberOfLines={6}
          text={post.hasSpoilers ? "Contém spoiler · toque em comentários para ler." : post.body}
        />
      ) : null}
      {REACTABLE.has(item.kind) && (
        <View style={[styles.actions, { borderTopColor: theme.border }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={post?.likedByMe ? "Descurtir" : "Curtir"}
            onPress={() => toggleLike.mutate({ activityId: item.id, like: !post?.likedByMe })}
            hitSlop={8}
          >
            <Text variant="label" color={post?.likedByMe ? "accent" : "textMuted"}>
              {post?.likedByMe ? "♥" : "♡"} {post?.likeCount ?? 0}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver comentários"
            disabled={thread.isPending}
            onPress={() =>
              post?.id
                ? openThread(post.id)
                : thread.mutate(item.id, {
                    onSuccess: ({ post: created }) => openThread(created.id),
                  })
            }
            hitSlop={8}
            style={styles.flex}
          >
            <Text variant="label" color="textMuted">
              {post?.id ? commentCountLabel(post.commentCount) : "Comentar"}
            </Text>
          </Pressable>
          {!mine && post?.id && post.body ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Denunciar ou bloquear"
              onPress={() =>
                showPostActions({
                  postId: post.id!,
                  author: actor,
                  block: (userId) => setBlocked.mutate({ userId, block: true }),
                })
              }
              hitSlop={10}
            >
              <Text variant="label" color="textMuted">
                ⋯
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </Card>
  );
}

/** Under the title: the progress bar, the stars or the shelf, depending on what happened. */
function BookDetail({ item }: { item: FeedItemData }) {
  const theme = useTheme();
  const { kind, data, reading, post } = item;
  if (kind === "progress") {
    const progress = activityProgress(data, reading?.pages ?? null);
    if (!progress) return null;
    return (
      <View style={styles.progress}>
        {progress.percent !== null && <ProgressBar percent={progress.percent} />}
        <Text variant="label" color="textMuted">
          {progress.label}
          {progress.percent !== null && ` · ${progress.percent}%`}
        </Text>
      </View>
    );
  }
  const rating = post?.rating ?? reading?.rating ?? null;
  if (rating) return <Stars value={rating} size={15} />;
  const status = data?.status as ShelfStatus | undefined;
  if (kind === "shelved" && status) {
    return (
      <View style={[styles.chip, { borderColor: theme.border }]}>
        <Text variant="label" color="textMuted">
          {SHELF_LABELS[status]}
        </Text>
      </View>
    );
  }
  return null;
}

/** "Quero ler" for a book you don't have yet, or where it already is on your shelves. */
function ShelfAction({
  book,
  status,
}: {
  book: NonNullable<FeedItemData["book"]> & { title: string; openLibraryId: string };
  status: ShelfStatus | null;
}) {
  const theme = useTheme();
  const shelve = useShelveFromFeed();
  if (status) {
    return (
      <Text variant="label" color="accent" style={styles.action}>
        ✓ Na sua estante · {SHELF_LABELS[status]}
      </Text>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => shelve.mutate({ book, status: "want_to_read" })}
      disabled={shelve.isPending}
      hitSlop={6}
      style={[styles.chip, styles.action, { borderColor: theme.edge }]}
    >
      <Text variant="label">+ Quero ler</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing[3],
  },
  bold: { fontWeight: "700" },
  book: { flexDirection: "row", gap: spacing[3] },
  bookInfo: { gap: spacing[1] },
  covers: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  more: {
    width: 52,
    aspectRatio: 2 / 3,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  progress: { gap: spacing[1], marginTop: spacing[1] },
  chip: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  action: { marginTop: "auto", paddingTop: spacing[1] },
  flex: { flex: 1 },
  quote: { fontStyle: "italic" },
});
