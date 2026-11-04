import {
  errorMessage,
  type GroupDetail,
  type GroupMessage,
  useGroup,
  useGroupMessages,
  useLeaveGroup,
  useRemoveGroupMember,
  useRemoveGroupMessage,
  useSendGroupMessage,
  useSetGroupFinishBy,
  useSetGroupOpen,
} from "@grimo/client";
import {
  GROUP_MESSAGE_MAX,
  groupMessageSchema,
  groupPace,
  invitePath,
  paceLabel,
  timeAgo,
} from "@grimo/core";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Share, StyleSheet, Switch, View } from "react-native";
import { Avatar, Button, Card, Input, ProgressBar, Screen, Text } from "@/components/ui";
import { FinishPicker, finishByFor, formatFinishBy } from "@/components/ui/finish-picker";
import { spacing } from "@/constants/theme";
import { BookCover } from "@/features/books";
import { openReport } from "@/features/moderation";
import { useTheme } from "@/hooks/use-theme";
import { SITE_URL } from "@/lib/server";

/** A group from inside: the book, everyone's progress, the invite and the conversation. */
export function GroupScreen({ id }: { id: string }) {
  const theme = useTheme();
  const { data, isPending, error } = useGroup(id);

  return (
    <Screen>
      <View style={styles.bar}>
        <Button variant="ghost" title="‹ Voltar" onPress={() => router.back()} />
      </View>
      {isPending ? (
        <ActivityIndicator color={theme.accent} />
      ) : !data ? (
        <Text color="textMuted">{error ? errorMessage(error) : "Grupo não encontrado."}</Text>
      ) : (
        <>
          <Header group={data} />
          <Members group={data} />
          <Invite code={data.inviteCode} title={data.book.title} />
          <Button
            variant="secondary"
            title={
              data.members.length >= 2 && data.members.every((member) => member.percent >= 100)
                ? "Card “Terminamos juntos”"
                : "Card do grupo para os Stories"
            }
            onPress={() => router.push({ pathname: "/group-card/[id]", params: { id: data.id } })}
          />
          <Chat id={data.id} />
          <Leave id={data.id} />
        </>
      )}
    </Screen>
  );
}

function Header({ group }: { group: GroupDetail }) {
  const me = group.members.find((member) => member.isYou);
  const pace = me ? groupPace(group.finishBy, me, new Date()) : null;
  const [editing, setEditing] = useState(false);
  const setFinishBy = useSetGroupFinishBy(group.id);

  return (
    <View style={styles.section}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir ${group.book.title}`}
        onPress={() =>
          router.push({ pathname: "/book/[id]", params: { id: group.book.openLibraryId } })
        }
        style={styles.hero}
      >
        <BookCover src={group.book.coverUrl} title={group.book.title} width={72} />
        <View style={styles.flex}>
          <Text variant="label" color="textMuted">
            Lendo juntos · {group.members.length}{" "}
            {group.members.length === 1 ? "pessoa" : "pessoas"}
          </Text>
          <Text variant="heading" numberOfLines={3}>
            {group.book.title}
          </Text>
          <Text color="accent" numberOfLines={1}>
            {group.book.authors.join(", ")}
          </Text>
        </View>
      </Pressable>

      <Card>
        <Text variant="title">
          {group.finishBy
            ? `Terminar até ${formatFinishBy(group.finishBy)}`
            : "Sem data para terminar"}
        </Text>
        {pace && <Text color="textMuted">{paceLabel(pace)} para você chegar lá.</Text>}
        {group.isOwner &&
          (editing ? (
            <FinishPicker
              days={undefined}
              onChange={(days) =>
                setFinishBy.mutate(finishByFor(days), { onSuccess: () => setEditing(false) })
              }
            />
          ) : (
            <Button variant="ghost" title="Mudar a data" onPress={() => setEditing(true)} />
          ))}
        {group.isOwner && <OpenSwitch id={group.id} open={group.isOpen} />}
        {group.entry?.status === "reading" && (
          <Button
            title="Registrar leitura"
            onPress={() =>
              router.push({
                pathname: "/progress/[id]",
                params: { id: group.book.openLibraryId },
              })
            }
          />
        )}
      </Card>
    </View>
  );
}

/** Everyone's progress, furthest first, in percent (editions differ in pages). */
function Members({ group }: { group: GroupDetail }) {
  const remove = useRemoveGroupMember(group.id);

  function confirmRemove(userId: string, name: string) {
    Alert.alert(`Tirar ${name} do grupo?`, "Só volta com o link do convite.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Tirar", style: "destructive", onPress: () => remove.mutate(userId) },
    ]);
  }

  return (
    <View style={styles.section}>
      <View style={styles.between}>
        <Text variant="heading">Quem está lendo</Text>
        <Text variant="label" color="textMuted">
          Grupo {group.groupPercent}%
        </Text>
      </View>
      {group.members.map((member) => (
        <Pressable
          key={member.id}
          accessibilityRole="button"
          accessibilityLabel={`${member.isYou ? "Você" : member.name}, ${member.percent}%`}
          onPress={() =>
            router.push({ pathname: "/u/[username]", params: { username: member.username } })
          }
          onLongPress={
            group.isOwner && !member.isYou ? () => confirmRemove(member.id, member.name) : undefined
          }
          style={styles.member}
        >
          <Avatar image={member.image} name={member.name} size={36} />
          <View style={styles.flex}>
            <View style={styles.between}>
              <Text style={styles.bold} numberOfLines={1}>
                {member.isYou ? "Você" : member.name}
              </Text>
              <Text variant="label" color={member.percent === 100 ? "accent" : "textMuted"}>
                {member.percent === 100 ? "terminou" : `${member.percent}%`}
              </Text>
            </View>
            <ProgressBar percent={member.percent} height={6} />
          </View>
        </Pressable>
      ))}
      {group.isOwner && group.members.length > 1 && (
        <Text variant="small" color="textMuted">
          Toque e segure em alguém para tirar do grupo.
        </Text>
      )}
    </View>
  );
}

/** The invite: the system share sheet with the link (it opens on the web for anyone). */
function Invite({ code, title }: { code: string; title: string }) {
  const url = `${SITE_URL}${invitePath(code)}`;
  return (
    <Card>
      <Text variant="title">Chame mais gente</Text>
      <Text color="textMuted">
        Quem abrir o link vê o livro e o progresso do grupo, e entra com um toque (até 20 pessoas).
        No app, dá para colar o link na aba Juntos.
      </Text>
      <Text variant="label" color="textMuted" selectable>
        {url}
      </Text>
      <Button
        title="Convidar"
        onPress={() => void Share.share({ message: `Bora ler ${title} juntos no Grimo? ${url}` })}
      />
    </Card>
  );
}

/**
 * The conversation, newest first under the composer. A message written further along than you
 * have read comes locked until you get there (no spoilers).
 */
function Chat({ id }: { id: string }) {
  const theme = useTheme();
  const list = useGroupMessages(id);
  const items = list.data?.items ?? [];

  return (
    <View style={styles.section}>
      <Text variant="heading">Conversa</Text>
      <Text variant="small" color="textMuted">
        Sem spoiler: cada mensagem abre quando você chega aonde quem escreveu estava.
      </Text>
      <Composer id={id} myPercent={list.data?.myPercent ?? 0} />
      {list.isPending ? (
        <ActivityIndicator color={theme.accent} />
      ) : items.length === 0 ? (
        <Text color="textMuted">Ninguém falou nada ainda. Comece a conversa!</Text>
      ) : (
        items.map((message) => <Message key={message.id} message={message} />)
      )}
      {list.hasNextPage && (
        <Button
          variant="secondary"
          title={list.isFetchingNextPage ? "Carregando…" : "Mensagens anteriores"}
          onPress={list.fetchNextPage}
        />
      )}
    </View>
  );
}

function Message({ message }: { message: GroupMessage }) {
  const remove = useRemoveGroupMessage();
  const pending = message.id.startsWith("pending-");

  function confirmRemove() {
    Alert.alert("Apagar mensagem?", undefined, [
      { text: "Cancelar", style: "cancel" },
      { text: "Apagar", style: "destructive", onPress: () => remove.mutate(message.id) },
    ]);
  }

  return (
    <Card>
      <View style={styles.author}>
        <Avatar image={message.author.image} name={message.author.name} size={28} />
        <Text variant="small" style={[styles.bold, styles.flex]} numberOfLines={1}>
          {message.mine ? "Você" : message.author.name}
        </Text>
        <Text variant="label" color="textMuted">
          em {message.percent}% · {timeAgo(new Date(message.createdAt))}
        </Text>
      </View>
      {message.body === null ? (
        <Text color="textMuted" style={styles.italic}>
          Abre quando você chegar a {message.percent}%.
        </Text>
      ) : (
        <Text>{message.body}</Text>
      )}
      {message.mine
        ? !pending && (
            <Pressable accessibilityRole="button" onPress={confirmRemove} hitSlop={10}>
              <Text variant="label" color="textMuted">
                Apagar
              </Text>
            </Pressable>
          )
        : message.body !== null && (
            <Pressable
              accessibilityRole="button"
              onPress={() => openReport("message", message.id)}
              hitSlop={10}
            >
              <Text variant="label" color="textMuted">
                Denunciar
              </Text>
            </Pressable>
          )}
    </Card>
  );
}

function Composer({ id, myPercent }: { id: string; myPercent: number }) {
  const send = useSendGroupMessage(id);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const input = groupMessageSchema.safeParse({ body });
    if (!input.success) return setError(input.error.issues[0]?.message ?? null);
    setError(null);
    setBody("");
    send.mutate(input.data.body, {
      onError: (failure) => {
        setBody(input.data.body);
        setError(errorMessage(failure));
      },
    });
  }

  return (
    <View style={styles.composer}>
      <Input
        placeholder="Escreva para o grupo"
        multiline
        maxLength={GROUP_MESSAGE_MAX}
        value={body}
        onChangeText={setBody}
      />
      <Text variant="small" color={error ? "danger" : "textMuted"}>
        {error ?? `Você está em ${myPercent}%: abre para quem já chegou aqui.`}
      </Text>
      <Button title="Enviar" disabled={!body.trim() || send.isPending} onPress={submit} />
    </View>
  );
}

function Leave({ id }: { id: string }) {
  const leave = useLeaveGroup();
  function confirm() {
    Alert.alert("Sair do grupo?", "O livro continua na sua estante.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => leave.mutate(id, { onSuccess: () => router.back() }),
      },
    ]);
  }
  return <Button variant="ghost" title="Sair do grupo" onPress={confirm} />;
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row" },
  section: { gap: spacing[3] },
  hero: { flexDirection: "row", gap: spacing[3], alignItems: "flex-end" },
  flex: { flex: 1, gap: spacing[1] },
  between: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  member: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  author: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  bold: { fontWeight: "700" },
  italic: { fontStyle: "italic" },
  composer: { gap: spacing[2] },
});

/** The creator opens the group to everyone ("leitura aberta") or closes it to invites. */
function OpenSwitch({ id, open }: { id: string; open: boolean }) {
  const theme = useTheme();
  const setOpen = useSetGroupOpen();
  return (
    <View style={openStyles.row}>
      <Text variant="small" color="textMuted" style={openStyles.flex}>
        Leitura aberta: qualquer leitor encontra e entra, sem convite
      </Text>
      <Switch
        value={open}
        disabled={setOpen.isPending}
        onValueChange={(value) => setOpen.mutate({ id, open: value })}
        trackColor={{ true: theme.accent, false: theme.border }}
        accessibilityLabel="Leitura aberta"
      />
    </View>
  );
}

const openStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  flex: { flex: 1 },
});
