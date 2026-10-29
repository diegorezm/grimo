import { errorMessage, useFriendsWant, useGroups, useJoinGroup } from "@grimo/client";
import { friendsWantLabel, membersLabel, parseInviteCode } from "@grimo/core";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AvatarStack, Button, Card, Input, ProgressBar, Screen, Text } from "@/components/ui";
import { formatFinishBy } from "@/components/ui/finish-picker";
import { spacing } from "@/constants/theme";
import { BookCover, BookTile } from "@/features/books";
import { useTheme } from "@/hooks/use-theme";

/** The Juntos tab: your groups, a field for an invite, and ideas when there are none. */
export function GroupList() {
  const theme = useTheme();
  const groups = useGroups();
  const items = groups.data?.items ?? [];

  return (
    <Screen>
      <Text variant="display">Juntos</Text>
      <Text color="textMuted">Ler o mesmo livro com outras pessoas, no ritmo de cada um.</Text>
      {groups.isPending ? (
        <ActivityIndicator color={theme.accent} />
      ) : items.length === 0 ? (
        <Card>
          <Text variant="title">Nenhum grupo ainda</Text>
          <Text color="textMuted">
            Abra um livro e toque em "Ler com alguém", ou entre com o link que um amigo mandou. Cada
            um vê o progresso de todos, e a conversa abre conforme você lê.
          </Text>
        </Card>
      ) : (
        items.map((group) => (
          <Pressable
            key={group.id}
            accessibilityRole="button"
            accessibilityLabel={`Grupo de ${group.book.title}`}
            onPress={() => router.push({ pathname: "/group/[id]", params: { id: group.id } })}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Card style={styles.group}>
              <BookCover src={group.book.coverUrl} title={group.book.title} width={56} />
              <View style={styles.flex}>
                <Text variant="title" numberOfLines={2}>
                  {group.book.title}
                </Text>
                <View style={styles.people}>
                  <AvatarStack people={group.others} size={20} />
                  <Text variant="small" color="textMuted" style={styles.flex} numberOfLines={1}>
                    {membersLabel(
                      group.others.map((member) => member.name),
                      true,
                    )}
                  </Text>
                </View>
                <ProgressBar percent={group.myPercent} height={4} />
                <Text variant="label" color="textMuted">
                  Você {group.myPercent}% · grupo {group.groupPercent}%
                  {group.finishBy ? ` · até ${formatFinishBy(group.finishBy)}` : ""}
                </Text>
              </View>
            </Card>
          </Pressable>
        ))
      )}
      <JoinByCode />
      <Ideas />
    </Screen>
  );
}

/** Paste an invite link (or just its code) to join. */
function JoinByCode() {
  const join = useJoinGroup();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const code = parseInviteCode(text);
    if (!code) return setError("Cole o link do convite ou o código de 8 letras.");
    setError(null);
    join.mutate(code, {
      onSuccess: ({ id }) => {
        setText("");
        router.push({ pathname: "/group/[id]", params: { id } });
      },
      onError: (failure) => setError(errorMessage(failure)),
    });
  }

  return (
    <View style={styles.section}>
      <Text variant="heading">Recebeu um convite?</Text>
      <Input
        value={text}
        onChangeText={setText}
        placeholder="Link ou código do convite"
        autoCapitalize="none"
        autoCorrect={false}
        onSubmitEditing={submit}
        returnKeyType="go"
      />
      {error && <Text color="danger">{error}</Text>}
      <Button title="Entrar no grupo" onPress={submit} disabled={join.isPending || !text.trim()} />
    </View>
  );
}

/** Books the people you follow want to read: each one is a group waiting to happen. */
function Ideas() {
  const items = (useFriendsWant().data?.items ?? []).slice(0, 6);
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text variant="heading">Que tal ler junto?</Text>
      <Text color="textMuted">
        Livros que quem você segue quer ler. Abra um e toque em "Ler com alguém".
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {items.map(({ book, friends }) => (
          <View key={book.id} style={styles.idea}>
            <BookTile book={book} width={96} />
            <Text variant="small" color="textMuted" numberOfLines={2}>
              {friendsWantLabel(friends.map((friend) => friend.name))}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { flexDirection: "row", gap: spacing[3] },
  flex: { flex: 1, gap: spacing[1] },
  people: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  section: { gap: spacing[3] },
  row: { gap: spacing[4] },
  idea: { width: 96, gap: spacing[1] },
});
