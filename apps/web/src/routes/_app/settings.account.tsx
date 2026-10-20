import { blockedReadersQuery, meQuery, useMe } from "@grimo/client";
import { createFileRoute } from "@tanstack/react-router";
import { Spinner } from "@/components/feedback/spinner";
import { Screen } from "@/components/layout/screen";
import { AccountSettings } from "@/features/account";

/** Account and privacy: download data, blocked readers, legal documents, delete account. */
export const Route = createFileRoute("/_app/settings/account")({
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(meQuery());
    void queryClient.prefetchQuery(blockedReadersQuery());
  },
  component: AccountPage,
});

function AccountPage() {
  const me = useMe();
  if (!me.data) return <Spinner />;
  return (
    <Screen back="Voltar" title="Conta e privacidade">
      <div className="mx-auto w-full max-w-2xl">
        <AccountSettings me={me.data} />
      </div>
    </Screen>
  );
}
