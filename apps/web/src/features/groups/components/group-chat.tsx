import {
  errorMessage,
  type GroupMessage,
  useGroupMessages,
  useRemoveGroupMessage,
  useSendGroupMessage,
} from "@grimo/client";
import { GROUP_MESSAGE_MAX, groupMessageSchema, timeAgo } from "@grimo/core";
import { type FormEvent, type KeyboardEvent, useState } from "react";
import { Spinner } from "@/components/feedback/spinner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ReportButton } from "@/features/moderation";
import { cn } from "@/utils/cn";

/**
 * The group's conversation, oldest at the top. Each message carries how far its author had read;
 * one further along than you comes locked until you get there (no spoilers).
 */
export function GroupChat({ id }: { id: string }) {
  const list = useGroupMessages(id);
  const items = [...(list.data?.items ?? [])].reverse();
  const myPercent = list.data?.myPercent ?? 0;

  return (
    <section
      aria-labelledby="chat-title"
      className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 @5xl/main:sticky @5xl/main:top-6"
    >
      <div className="flex flex-col gap-1">
        <h2 id="chat-title" className="text-2xl font-medium italic">
          Conversa
        </h2>
        <p className="text-xs text-text-muted">
          Sem spoiler: cada mensagem abre quando você chega aonde quem escreveu estava.
        </p>
      </div>
      {list.hasNextPage && (
        <Button
          variant="ghost"
          onClick={list.fetchNextPage}
          disabled={list.isFetchingNextPage}
          className="self-center"
        >
          Mensagens anteriores
        </Button>
      )}
      {list.isPending ? (
        <Spinner />
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-muted">
          Ninguém falou nada ainda. Comece a conversa!
        </p>
      ) : (
        <ol className="flex max-h-[32rem] flex-col gap-4 overflow-y-auto pr-1">
          {items.map((message) => (
            <Message key={message.id} message={message} />
          ))}
        </ol>
      )}
      <Composer id={id} myPercent={myPercent} />
    </section>
  );
}

function Message({ message }: { message: GroupMessage }) {
  const remove = useRemoveGroupMessage();
  return (
    <li className="flex gap-3">
      <Avatar src={message.author.image} name={message.author.name} size="size-8" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-semibold">{message.mine ? "Você" : message.author.name}</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
            em {message.percent}% · {timeAgo(new Date(message.createdAt))}
          </span>
        </p>
        {message.body === null ? (
          <p className="rounded-md bg-surface-muted px-3 py-2 text-sm text-text-muted italic">
            Abre quando você chegar a {message.percent}%.
          </p>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-line">{message.body}</p>
        )}
        <p className="flex gap-3 font-mono text-[10px] uppercase tracking-wider text-text-muted">
          {message.mine
            ? // Still being sent: nothing to delete on the server yet.
              !message.id.startsWith("pending-") && (
                <button
                  type="button"
                  onClick={() => remove.mutate(message.id)}
                  className="hover:text-danger"
                >
                  Apagar
                </button>
              )
            : message.body !== null && <ReportButton target="message" targetId={message.id} />}
        </p>
      </div>
    </li>
  );
}

function Composer({ id, myPercent }: { id: string; myPercent: number }) {
  const send = useSendGroupMessage(id);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event?: FormEvent) {
    event?.preventDefault();
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

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-2 border-t border-border pt-4">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={onKeyDown}
        rows={2}
        maxLength={GROUP_MESSAGE_MAX}
        placeholder="Escreva para o grupo"
        aria-label="Mensagem para o grupo"
        className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <div className="flex items-center justify-between gap-3">
        <p
          className={cn("text-xs", error ? "text-danger" : "text-text-muted")}
          role={error ? "alert" : undefined}
        >
          {error ?? `Você está em ${myPercent}%: abre para quem já chegou aqui.`}
        </p>
        <Button type="submit" disabled={!body.trim() || send.isPending}>
          Enviar
        </Button>
      </div>
    </form>
  );
}
