import {
  errorMessage,
  type GroupDetail,
  useGroup,
  useLeaveGroup,
  useRemoveGroupMember,
  useSetGroupFinishBy,
  useSetGroupOpen,
} from "@grimo/client";
import { groupPace, invitePath, paceLabel } from "@grimo/core";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/feedback/spinner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FinishPicker, finishByFor, formatFinishBy } from "@/components/ui/finish-picker";
import { CheckIcon, ShareIcon } from "@/components/ui/icons";
import { ProgressBar } from "@/components/ui/progress-bar";
import { BookCover, BookPeekLink, PageLogger } from "@/features/books";
import { cn } from "@/utils/cn";
import { GroupChat } from "./group-chat";

/** A group from inside: the book, everyone's progress side by side, the invite and the talk. */
export function GroupView({ id }: { id: string }) {
  const { data, isPending, error } = useGroup(id);
  if (isPending) return <Spinner />;
  if (!data) {
    return (
      <p className="rounded-xl bg-surface-muted p-6 text-text-muted">
        {error ? errorMessage(error) : "Grupo não encontrado."}{" "}
        <Link to="/juntos" className="font-semibold text-accent hover:underline">
          Ver seus grupos
        </Link>
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-10 @5xl/main:grid-cols-[minmax(0,1fr)_24rem] @5xl/main:items-start">
      <div className="flex min-w-0 flex-col gap-10">
        <Header group={data} />
        <Members group={data} />
        <InviteBox code={data.inviteCode} title={data.book.title} />
        <Link
          to="/juntos/$id/card"
          params={{ id: data.id }}
          className="w-fit rounded-full border border-border px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-text-muted transition hover:border-accent/50 hover:text-accent"
        >
          {data.members.length >= 2 && data.members.every((member) => member.percent >= 100)
            ? "Card “Terminamos juntos”"
            : "Card do grupo para os Stories"}
        </Link>
        <LeaveGroup id={data.id} />
      </div>
      <GroupChat id={data.id} />
    </div>
  );
}

function Header({ group }: { group: GroupDetail }) {
  const me = group.members.find((member) => member.isYou);
  const pace = me ? groupPace(group.finishBy, me, new Date()) : null;
  const [editing, setEditing] = useState(false);

  return (
    <header className="flex flex-col gap-5">
      <div className="flex items-end gap-5">
        <BookPeekLink openLibraryId={group.book.openLibraryId}>
          <BookCover src={group.book.coverUrl} title={group.book.title} className="w-24" />
        </BookPeekLink>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted">
            Lendo juntos · {group.members.length}{" "}
            {group.members.length === 1 ? "pessoa" : "pessoas"}
          </p>
          <h1 className="text-3xl leading-tight font-medium italic">{group.book.title}</h1>
          <p className="text-accent italic">{group.book.authors.join(", ")}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-xl bg-surface-muted p-5">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-serif text-xl font-medium">
            {group.finishBy
              ? `Terminar até ${formatFinishBy(group.finishBy)}`
              : "Sem data para terminar"}
          </span>
          {group.isOwner && (
            <button
              type="button"
              onClick={() => setEditing(!editing)}
              className="font-mono text-[11px] uppercase tracking-wider text-accent hover:opacity-80"
            >
              {editing ? "Fechar" : "Mudar"}
            </button>
          )}
        </p>
        {pace && <p className="text-sm text-text-muted">{paceLabel(pace)} para você chegar lá.</p>}
        {editing && <FinishEditor id={group.id} onDone={() => setEditing(false)} />}
        {group.isOwner && <OpenSwitch id={group.id} open={group.isOpen} />}
        {group.entry?.status === "reading" && (
          <div className="mt-3 border-t border-border pt-4">
            <PageLogger
              entryId={group.entry.id}
              page={group.entry.currentPage}
              pageCount={me?.pages ?? null}
            />
          </div>
        )}
      </div>
    </header>
  );
}

function FinishEditor({ id, onDone }: { id: string; onDone: () => void }) {
  const update = useSetGroupFinishBy(id);
  return (
    <FinishPicker
      days={undefined}
      onChange={(days) => update.mutate(finishByFor(days), { onSuccess: onDone })}
    />
  );
}

/** Everyone's progress, furthest first, in percent (editions differ in pages). */
function Members({ group }: { group: GroupDetail }) {
  const remove = useRemoveGroupMember(group.id);
  return (
    <section aria-labelledby="members-title" className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="members-title" className="text-2xl font-medium italic">
          Quem está lendo
        </h2>
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
          Grupo {group.groupPercent}%
        </span>
      </div>
      <ul className="flex flex-col divide-y divide-border">
        {group.members.map((member) => (
          <li key={member.id} className="flex items-center gap-3 py-3 first:pt-0">
            <Avatar src={member.image} name={member.name} size="size-10" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="flex items-center gap-2 text-sm">
                <Link
                  to="/u/$username"
                  params={{ username: member.username }}
                  className="truncate font-semibold hover:underline"
                >
                  {member.isYou ? "Você" : member.name}
                </Link>
                {member.isOwner && (
                  <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                    criou o grupo
                  </span>
                )}
                {member.percent === 100 && (
                  <span className="font-mono text-[10px] uppercase tracking-wider text-accent">
                    terminou
                  </span>
                )}
              </p>
              <ProgressBar percent={member.percent} />
            </div>
            {group.isOwner && !member.isYou && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Tirar ${member.name} do grupo?`)) remove.mutate(member.id);
                }}
                className="font-mono text-[10px] uppercase tracking-wider text-text-muted hover:text-danger"
              >
                Tirar
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The invite link: share sheet on phones, copy elsewhere. Anyone with it can join. */
function InviteBox({ code, title }: { code: string; title: string }) {
  const url = `${window.location.origin}${invitePath(code)}`;
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function share() {
    const text = `Bora ler ${title} juntos no Grimo?`;
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // Cancelled or not allowed: copy instead.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("Copie o link do convite:", url);
    }
  }

  return (
    <section
      aria-labelledby="invite-title"
      className="flex flex-col gap-3 rounded-xl border border-dashed border-border p-5"
    >
      <h2 id="invite-title" className="text-xl font-medium italic">
        Chame mais gente
      </h2>
      <p className="text-sm text-text-muted">
        Quem abrir o link vê o livro e o progresso do grupo, e entra com um toque (até 20 pessoas).
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <code className="rounded-md bg-surface-muted px-3 py-2 font-mono text-sm">{url}</code>
        <Button onClick={share}>
          {copied ? <CheckIcon className="size-4" /> : <ShareIcon className="size-4" />}
          <span aria-live="polite">{copied ? "Link copiado" : "Convidar"}</span>
        </Button>
      </div>
    </section>
  );
}

function LeaveGroup({ id }: { id: string }) {
  const leave = useLeaveGroup();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  return (
    <div className={cn("flex items-center gap-3 font-mono text-[11px] uppercase tracking-wider")}>
      {confirming ? (
        <>
          <span className="text-text-muted">O livro continua na sua estante.</span>
          <button
            type="button"
            onClick={() => leave.mutate(id, { onSuccess: () => void navigate({ to: "/juntos" }) })}
            className="text-danger hover:underline"
          >
            Sair do grupo
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-text-muted hover:text-text"
          >
            Cancelar
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-text-muted hover:text-text"
        >
          Sair do grupo
        </button>
      )}
    </div>
  );
}

/** The creator opens the group to everyone ("leitura aberta") or closes it to invites. */
function OpenSwitch({ id, open }: { id: string; open: boolean }) {
  const setOpen = useSetGroupOpen();
  return (
    <label className="mt-2 flex items-center gap-2 text-sm text-text-muted">
      <input
        type="checkbox"
        checked={open}
        disabled={setOpen.isPending}
        onChange={(e) => setOpen.mutate({ id, open: e.target.checked })}
      />
      Leitura aberta: qualquer leitor encontra e entra, sem convite
    </label>
  );
}
