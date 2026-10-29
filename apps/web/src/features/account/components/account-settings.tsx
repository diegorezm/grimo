import {
  deleteAccount,
  errorMessage,
  exportFileName,
  type Me,
  useBlockedReaders,
  useExportData,
  useSetBlocked,
} from "@grimo/client";
import { deleteConfirmationMatches } from "@grimo/core";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, type ReactNode, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LegalLinks } from "@/features/legal";
import { clearCacheForSignOut } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

/**
 * "Conta e privacidade": the LGPD rights the app handles by itself (copy of the data, deletion),
 * the blocked readers and the legal documents.
 */
export function AccountSettings({ me }: { me: Me }) {
  return (
    <div className="flex flex-col gap-10">
      <Block
        title="Baixar meus dados"
        text="Uma cópia de tudo o que o Grimo guarda sobre você (perfil, estantes, leituras, resenhas, seguidores, aceites), em um arquivo JSON."
      >
        <ExportButton username={me.username} />
      </Block>
      {me.isAdmin && (
        <Block title="Moderação" text="Denúncias abertas e livros cadastrados para revisar.">
          <Link to="/admin" className="w-fit font-semibold text-accent hover:underline">
            Abrir o painel
          </Link>
        </Block>
      )}
      <Block
        title="Trazer suas estantes"
        text="Importe sua biblioteca do Goodreads: livros, notas e datas de leitura."
      >
        <Link to="/importar" className="w-fit font-semibold text-accent hover:underline">
          Importar do Goodreads
        </Link>
      </Block>
      <Block title="Leitores bloqueados" text="Quem você bloqueia não vê nem interage com você.">
        <BlockedList />
      </Block>
      <Block title="Documentos" text="O que combinamos e como cuidamos dos seus dados.">
        <LegalLinks />
      </Block>
      <Block
        title="Excluir conta"
        text="Apaga sua conta e tudo o que você publicou, de forma definitiva. Seu @ fica livre."
        danger
      >
        <DeleteAccount username={me.username} />
      </Block>
    </div>
  );
}

function Block({
  title,
  text,
  danger = false,
  children,
}: {
  title: string;
  text: string;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={
        danger
          ? "flex flex-col gap-4 rounded-xl border border-danger/30 p-5"
          : "flex flex-col gap-4 border-b border-border pb-10"
      }
    >
      <div className="flex flex-col gap-1">
        <h2
          className={
            danger ? "text-2xl font-medium italic text-danger" : "text-2xl font-medium italic"
          }
        >
          {title}
        </h2>
        <p className="text-text-muted">{text}</p>
      </div>
      {children}
    </section>
  );
}

function ExportButton({ username }: { username: string }) {
  const exportData = useExportData();

  function download() {
    exportData.mutate(undefined, {
      onSuccess: (data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = exportFileName(username);
        link.click();
        URL.revokeObjectURL(url);
      },
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button variant="secondary" disabled={exportData.isPending} onClick={download}>
        {exportData.isPending ? "Preparando…" : "Baixar meus dados"}
      </Button>
      {exportData.error && <p className="text-sm text-danger">{errorMessage(exportData.error)}</p>}
    </div>
  );
}

function BlockedList() {
  const blocked = useBlockedReaders();
  const setBlocked = useSetBlocked();
  const items = blocked.data?.items ?? [];
  if (blocked.data && items.length === 0) {
    return <p className="text-sm text-text-muted">Você não bloqueou ninguém.</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {items.map((reader) => (
        <li key={reader.id} className="flex items-center gap-3">
          <Avatar src={reader.image} name={reader.name} size="size-10" />
          <Link
            to="/u/$username"
            params={{ username: reader.username }}
            className="min-w-0 flex-1 truncate hover:underline"
          >
            {reader.name}{" "}
            <span className="font-mono text-xs text-text-muted">@{reader.username}</span>
          </Link>
          <Button
            variant="ghost"
            onClick={() => setBlocked.mutate({ userId: reader.id, block: false })}
          >
            Desbloquear
          </Button>
        </li>
      ))}
    </ul>
  );
}

/** Whether the account has a password (email sign-up) or only Google/Apple. */
function useHasPassword() {
  return useQuery({
    queryKey: ["auth", "accounts"],
    queryFn: async () => {
      const { data } = await authClient.listAccounts();
      return (data ?? []).some((account) => account.providerId === "credential");
    },
    staleTime: 60_000,
  });
}

function DeleteAccount({ username }: { username: string }) {
  const navigate = useNavigate();
  const hasPassword = useHasPassword();
  const [typed, setTyped] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!deleteConfirmationMatches(typed, username)) {
      return setError(`Digite @${username} para confirmar.`);
    }
    if (hasPassword.data && !password) return setError("Digite sua senha.");
    setPending(true);
    setError(null);
    const outcome = await deleteAccount(authClient, hasPassword.data ? password : undefined);
    if (outcome.status === "error") {
      setPending(false);
      return setError(outcome.message);
    }
    await clearCacheForSignOut();
    await navigate({ to: "/welcome" });
  }

  return (
    <form onSubmit={submit} noValidate className="flex max-w-sm flex-col gap-3">
      <label htmlFor="delete-confirm" className="text-sm">
        Para confirmar, digite <span className="font-mono">@{username}</span>
      </label>
      <Input
        id="delete-confirm"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        autoCapitalize="none"
        spellCheck={false}
        placeholder={`@${username}`}
      />
      {hasPassword.data && (
        <>
          <label htmlFor="delete-password" className="text-sm">
            Sua senha
          </label>
          <Input
            id="delete-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={pending || hasPassword.isPending}
        className="self-start rounded-full border border-danger px-5 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-danger transition hover:bg-danger/10 disabled:opacity-50"
      >
        {pending ? "Excluindo…" : "Excluir minha conta"}
      </button>
    </form>
  );
}
