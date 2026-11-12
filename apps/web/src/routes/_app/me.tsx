import {
  meQuery,
  monthlySummaryQuery,
  profileShelvesQuery,
  readerQuery,
  readerShelvesQuery,
  streakQuery,
  useMe,
  useReader,
  useStreak,
} from "@grimo/client";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Spinner } from "@/components/feedback/spinner";
import { PencilIcon } from "@/components/ui/icons";
import { ProfileView } from "@/features/profile";
import { ReaderActivity, ShareProfileButton } from "@/features/readers";
import { MonthlyCard, YearStats } from "@/features/stats";

export const Route = createFileRoute("/_app/me")({
  loader: async ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(monthlySummaryQuery());
    void queryClient.prefetchQuery(streakQuery());
    const me = queryClient.getQueryData(meQuery().queryKey);
    if (me) {
      void queryClient.prefetchQuery(readerQuery(me.username));
      void queryClient.prefetchQuery(readerShelvesQuery(me.username));
      void queryClient.prefetchQuery(profileShelvesQuery(me.username));
    }
  },
  component: MePage,
});

/**
 * Your profile, as others see it, with "Editar perfil" (side peek), share and, in the year tab,
 * the monthly card.
 */
function MePage() {
  const me = useMe().data;
  const page = useReader(me?.username ?? "").data;
  const streak = useStreak().data;
  if (!me || !page) return <Spinner />;

  return (
    <ProfileView
      page={page}
      username={me.username}
      streak={streak?.days ?? null}
      actions={
        <>
          <ShareProfileButton username={me.username} name={me.name} own />
          <Link
            to="."
            search={(prev) => ({ ...prev, panel: "profile" as const })}
            resetScroll={false}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface py-2.5 pr-5 pl-4 font-mono text-xs font-medium tracking-wider uppercase shadow-sm shadow-shadow transition hover:border-accent/50 hover:text-accent"
          >
            <PencilIcon className="size-4" />
            Editar perfil
          </Link>
        </>
      }
      activity={<ReaderActivity username={me.username} interactive />}
      isMe
      year={<YearStats stats={page.stats} />}
      aside={
        <section className="flex flex-col items-start gap-3 rounded-2xl bg-surface-muted/70 p-5">
          <div>
            <h3 className="text-xl font-medium italic">Card do mês</h3>
            <p className="text-sm text-text-muted">Seu mês pronto para os Stories.</p>
          </div>
          <MonthlyCard />
        </section>
      }
    />
  );
}
