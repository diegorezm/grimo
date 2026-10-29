import { inviteQuery } from "@grimo/client";
import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/layout/screen";
import { InviteView } from "@/features/groups";

/** Invite link: public (signed out it shows the group and a way in). */
export const Route = createFileRoute("/_app/j/$code")({
  loader: ({ context: { queryClient }, params: { code } }) => {
    void queryClient.prefetchQuery(inviteQuery(code));
  },
  component: InvitePage,
});

function InvitePage() {
  const { code } = Route.useParams();
  const { session } = Route.useRouteContext();
  return (
    <Screen>
      <InviteView code={code} signedIn={Boolean(session)} />
    </Screen>
  );
}
