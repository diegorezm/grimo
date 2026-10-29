import { errorMessage, useMyModeratorInvite, useRespondToModeratorInvite } from "@grimo/client";
import { Button } from "@/components/ui/button";

/**
 * Shown to a reader an admin invited to moderate (`moderators.myInvite`): accept or decline
 * before the invite expires (24 h).
 */
export function ModeratorInviteBanner() {
  const invite = useMyModeratorInvite().data;
  const respond = useRespondToModeratorInvite();
  if (!invite) return null;

  const until = new Date(invite.expiresAt).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-surface-muted px-4 py-3 text-sm lg:px-8"
    >
      <p className="min-w-0 flex-1">
        <strong>Convite para moderar o Grimo.</strong>{" "}
        {invite.invitedBy ? `@${invite.invitedBy.username} chamou você` : "Você foi chamado"} para
        analisar denúncias. Quem aceita ganha um selo público de moderador no perfil e nas
        publicações. Responda até {until}.
        {respond.error && <span className="text-danger"> {errorMessage(respond.error)}</span>}
      </p>
      <div className="flex gap-2">
        <Button
          disabled={respond.isPending}
          onClick={() => respond.mutate({ inviteId: invite.id, accept: true })}
        >
          Aceitar
        </Button>
        <Button
          variant="ghost"
          disabled={respond.isPending}
          onClick={() => respond.mutate({ inviteId: invite.id, accept: false })}
        >
          Recusar
        </Button>
      </div>
    </div>
  );
}
