import { errorMessage, useInvite, useJoinGroup, useMe } from "@grimo/client";
import { membersLabel } from "@grimo/core";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Spinner } from "@/components/feedback/spinner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatFinishBy } from "@/components/ui/finish-picker";
import { ProgressBar } from "@/components/ui/progress-bar";
import { BookCover } from "@/features/books";
import { savePendingInvite, takePendingInvite } from "../pending-invite";

const primaryLink =
  "bg-accent-gradient rounded-full px-6 py-3 font-mono text-xs font-medium uppercase tracking-wider text-accent-foreground shadow-md shadow-accent/30 hover:opacity-90";

/**
 * An invite link (`/j/<code>`), signed in or not: the book, who is reading and how far, and one
 * button to join. Signed out, the code is kept so the new account lands in the group.
 */
export function InviteView({ code, signedIn }: { code: string; signedIn: boolean }) {
  const { data, isPending } = useInvite(code);
  const join = useJoinGroup();
  const navigate = useNavigate();
  // Back here with a set-up account: the button joins. A new one (e.g. back from Google) keeps
  // the code for the onboarding, where the setup guard sends it.
  const needsSetup = useMe({ enabled: signedIn }).data?.needsSetup;
  useEffect(() => {
    if (needsSetup === false) takePendingInvite();
  }, [needsSetup]);

  if (isPending) return <Spinner />;
  if (!data) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-3 py-16 text-center">
        <h1 className="text-3xl font-medium italic">Convite inválido</h1>
        <p className="text-text-muted">
          O link pode ter sido digitado errado, ou o grupo não existe mais.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-8 py-10 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-text-muted">
        Convite para ler juntos
      </p>
      <BookCover
        src={data.book.coverUrl}
        title={data.book.title}
        className="w-36 shadow-lg shadow-shadow"
      />
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl leading-tight font-medium italic">{data.book.title}</h1>
        <p className="text-lg text-accent italic">{data.book.authors.join(", ")}</p>
        <p className="text-text-muted">
          {membersLabel(
            data.members.map((member) => member.name),
            false,
          )}{" "}
          {data.memberCount === 1 ? "está lendo" : "estão lendo"}
          {data.finishBy && `, para terminar até ${formatFinishBy(data.finishBy)}`}.
        </p>
      </div>

      <ul className="flex w-full flex-col gap-3 rounded-xl bg-surface-muted p-5 text-left">
        {data.members.map((member) => (
          <li key={member.id} className="flex items-center gap-3">
            <Avatar src={member.image} name={member.name} size="size-8" />
            <span className="w-28 truncate text-sm font-semibold">{member.name}</span>
            <ProgressBar percent={member.percent} className="flex-1" />
          </li>
        ))}
      </ul>

      {data.isMember ? (
        <Link to="/juntos/$id" params={{ id: data.id }} className={primaryLink}>
          Abrir o grupo
        </Link>
      ) : signedIn ? (
        <div className="flex flex-col items-center gap-2">
          <Button
            onClick={() =>
              join.mutate(code, {
                onSuccess: ({ id }) => navigate({ to: "/juntos/$id", params: { id } }),
              })
            }
            disabled={join.isPending}
          >
            Entrar no grupo
          </Button>
          <p className="text-xs text-text-muted">O livro vai para a sua estante “Lendo”.</p>
          {join.error && (
            <p role="alert" className="text-sm text-danger">
              {errorMessage(join.error)}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Link
            to="/login"
            search={{ redirect: `/j/${code}` }}
            onClick={() => savePendingInvite(code)}
            className={primaryLink}
          >
            Entrar ou criar conta
          </Link>
          <p className="text-xs text-text-muted">Grátis. Você entra no grupo logo depois.</p>
        </div>
      )}
    </div>
  );
}
