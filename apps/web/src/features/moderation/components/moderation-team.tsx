import {
  errorMessage,
  useInviteModerator,
  useModerationTeam,
  useRemoveModerator,
  useRevokeModeratorInvite,
} from "@grimo/client";
import { useState } from "react";
import { Spinner } from "@/components/feedback/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Admins only: who moderates, open invites (24 h), and a form to invite someone by @. */
export function ModerationTeam() {
  const team = useModerationTeam();
  const invite = useInviteModerator();
  const revoke = useRevokeModeratorInvite();
  const remove = useRemoveModerator();
  const [username, setUsername] = useState("");

  return (
    <section aria-labelledby="team-title" className="flex flex-col gap-4">
      <h2 id="team-title" className="text-2xl font-medium italic">
        Equipe
      </h2>
      <form
        noValidate
        className="flex flex-wrap items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!username.trim()) return;
          invite.mutate(username, { onSuccess: () => setUsername("") });
        }}
      >
        <Input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="@ de quem convidar"
          aria-label="@ de quem convidar"
          className="max-w-xs"
        />
        <Button type="submit" disabled={invite.isPending || !username.trim()}>
          Convidar para moderar
        </Button>
      </form>
      <p className="text-sm text-text-muted">
        O convite vale 24 horas e só para essa conta. Quem aceitar passa a ver a fila de denúncias.
      </p>
      {invite.error && <p className="text-sm text-danger">{errorMessage(invite.error)}</p>}

      {team.isPending ? (
        <Spinner />
      ) : team.error ? (
        <p className="text-text-muted">{errorMessage(team.error)}</p>
      ) : (
        <>
          <ul className="flex flex-col divide-y divide-border">
            {team.data.moderators.length === 0 && (
              <li className="py-3 text-text-muted">Nenhum moderador ainda.</li>
            )}
            {team.data.moderators.map((reader) => (
              <li key={reader.id} className="flex items-center gap-4 py-3 text-sm">
                <span className="min-w-0 flex-1">
                  <strong>{reader.name}</strong> (@{reader.username})
                </span>
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
              </li>
            ))}
          </ul>
          {team.data.invites.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
                Convites abertos
              </h3>
              <ul className="flex flex-col divide-y divide-border">
                {team.data.invites.map((item) => (
                  <li key={item.id} className="flex items-center gap-4 py-3 text-sm">
                    <span className="min-w-0 flex-1">
                      {item.user ? `@${item.user.username}` : "conta excluída"}{" "}
                      <span className="text-text-muted">
                        · até{" "}
                        {new Date(item.expiresAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </span>
                    <Button
                      variant="ghost"
                      disabled={revoke.isPending}
                      onClick={() => revoke.mutate(item.id)}
                    >
                      Cancelar
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(remove.error || revoke.error) && (
            <p className="text-sm text-danger">{errorMessage(remove.error ?? revoke.error)}</p>
          )}
        </>
      )}
    </section>
  );
}
