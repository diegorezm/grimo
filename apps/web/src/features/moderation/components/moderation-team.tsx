import {
  errorMessage,
  useInviteModerator,
  useModerationTeam,
  useRemoveModerator,
  useRevokeModeratorInvite,
} from "@grimo/client";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Spinner } from "@/components/feedback/spinner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StaffBadge } from "@/components/ui/staff-badge";
import { Card, CardBanner, CardGrid } from "./card-grid";

const deadline = (ms: number) =>
  new Date(ms).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Admins only: who moderates, open invites (24 h), and a form to invite someone by @. */
export function ModerationTeam() {
  const team = useModerationTeam();
  const invite = useInviteModerator();
  const revoke = useRevokeModeratorInvite();
  const remove = useRemoveModerator();
  const [username, setUsername] = useState("");

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="invite-title" className="flex flex-col gap-3">
        <h2 id="invite-title" className="text-2xl font-medium italic">
          Convidar para moderar
        </h2>
        <form
          noValidate
          className="flex flex-wrap items-center gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!username.trim()) return;
            invite.mutate(username, { onSuccess: () => setUsername("") });
          }}
        >
          <label className="flex min-w-0 flex-1 items-center gap-3 rounded-full bg-surface-muted px-5 py-3 focus-within:ring-2 focus-within:ring-accent/40 sm:max-w-md">
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="@usuario"
              aria-label="@ de quem convidar"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
            />
          </label>
          <Button type="submit" disabled={invite.isPending || !username.trim()}>
            {invite.isPending ? "Enviando…" : "Convidar"}
          </Button>
        </form>
        <p className="text-sm text-text-muted">
          O convite vale 24 horas e só para essa conta. Quem aceitar passa a ver a fila de denúncias
          e ganha um selo público de moderador.
        </p>
        {invite.error && <p className="text-sm text-danger">{errorMessage(invite.error)}</p>}
      </section>

      {team.isPending ? (
        <Spinner />
      ) : team.error ? (
        <p className="rounded-xl bg-surface-muted p-6 text-text-muted">
          {errorMessage(team.error)}
        </p>
      ) : (
        <>
          {team.data.invites.length > 0 && (
            <section aria-labelledby="open-invites-title" className="flex flex-col gap-3">
              <h2 id="open-invites-title" className="text-2xl font-medium italic">
                Convites abertos
              </h2>
              <CardGrid>
                {team.data.invites.map((item) => (
                  <Card key={item.id}>
                    <CardBanner left="Convite" right={`até ${deadline(item.expiresAt)}`} />
                    <div className="flex flex-1 flex-col gap-3 px-5 pb-5">
                      <Avatar
                        src={item.user?.image ?? null}
                        name={item.user?.name ?? "?"}
                        size="size-14"
                        className="relative -mt-7 bg-accent-gradient text-accent-foreground shadow-md ring-4 ring-surface"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-serif text-xl font-medium italic leading-tight">
                          {item.user?.name ?? "Conta excluída"}
                        </p>
                        {item.user && (
                          <p className="truncate font-mono text-[11px] text-text-muted">
                            @{item.user.username}
                          </p>
                        )}
                      </div>
                      <p className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
                        <span className="truncate font-mono text-[11px] uppercase tracking-wider text-text-muted">
                          {item.invitedBy ? `por @${item.invitedBy.username}` : "convite"}
                        </span>
                        <Button
                          variant="ghost"
                          disabled={revoke.isPending}
                          onClick={() => revoke.mutate(item.id)}
                        >
                          Cancelar
                        </Button>
                      </p>
                    </div>
                  </Card>
                ))}
              </CardGrid>
            </section>
          )}

          <section aria-labelledby="moderators-title" className="flex flex-col gap-3">
            <h2 id="moderators-title" className="text-2xl font-medium italic">
              Moderadores
            </h2>
            {team.data.moderators.length === 0 ? (
              <p className="rounded-xl bg-surface-muted p-6 text-text-muted">
                Nenhum moderador ainda. Convide alguém pelo @ acima.
              </p>
            ) : (
              <CardGrid>
                {team.data.moderators.map((reader) => (
                  <Card key={reader.id}>
                    <CardBanner left="Moderação" />
                    <div className="flex flex-1 flex-col gap-3 px-5 pb-5">
                      <Avatar
                        src={reader.image}
                        name={reader.name}
                        size="size-14"
                        className="relative -mt-7 bg-accent-gradient text-accent-foreground shadow-md ring-4 ring-surface"
                      />
                      <div className="min-w-0">
                        <Link
                          to="/u/$username"
                          params={{ username: reader.username }}
                          className="block truncate font-serif text-xl font-medium italic leading-tight hover:underline"
                        >
                          {reader.name}
                        </Link>
                        <p className="flex items-center gap-2 truncate font-mono text-[11px] text-text-muted">
                          @{reader.username}
                          <StaffBadge role={reader.role} />
                        </p>
                      </div>
                      <div className="mt-auto flex justify-end border-t border-border pt-4">
                        <Button
                          variant="ghost"
                          className="text-danger"
                          disabled={remove.isPending}
                          onClick={() => {
                            if (window.confirm(`Tirar @${reader.username} da moderação?`)) {
                              remove.mutate(reader.id);
                            }
                          }}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </CardGrid>
            )}
          </section>
          {(remove.error || revoke.error) && (
            <p className="text-sm text-danger">{errorMessage(remove.error ?? revoke.error)}</p>
          )}
        </>
      )}
    </div>
  );
}
