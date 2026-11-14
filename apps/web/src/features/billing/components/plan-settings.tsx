import {
  errorMessage,
  useBillingStatus,
  useOpenBillingPortal,
  useStartCheckout,
} from "@grimo/client";
import {
  formatPrice,
  PLUS_PLAN,
  type PlanInterval,
  SHOP_ITEMS,
  type ShopItemKey,
} from "@grimo/core";
import { useSearch } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Spinner } from "@/components/feedback/spinner";
import { Button } from "@/components/ui/button";

const INTERVAL_LABEL: Record<PlanInterval, string> = { monthly: "por mês", yearly: "por ano" };

const date = (ms: number | null) => (ms === null ? "—" : new Date(ms).toLocaleDateString("pt-BR"));

/** "Plano e lojinha": the Grimo Plus subscription and the shop's items (Stripe hosts the payment). */
export function PlanSettings() {
  const status = useBillingStatus();
  const search = useSearch({ strict: false }) as { checkout?: string };
  if (!status.data) return <Spinner />;
  const { enabled, plan, subscription, items } = status.data;

  return (
    <div className="flex flex-col gap-10">
      {search.checkout === "success" && (
        <p className="rounded-xl border border-accent/40 bg-accent/10 p-4">
          Pagamento recebido! Pode levar alguns segundos para aparecer aqui.
        </p>
      )}
      {!enabled && (
        <p className="rounded-xl border border-border p-4 text-text-muted">
          Os pagamentos ainda não estão ligados neste ambiente.
        </p>
      )}
      <Block
        title="Grimo Plus"
        text={
          plan === "plus"
            ? subscription?.cancelAtPeriodEnd
              ? `Você tem o Plus até ${date(subscription.currentPeriodEnd)}. Ele não vai renovar.`
              : `Você é Plus${subscription?.currentPeriodEnd ? `: renova em ${date(subscription.currentPeriodEnd)}` : ""}.`
            : "Apoie o Grimo e ganhe os recursos Plus."
        }
      >
        {plan === "plus" ? <ManageButton /> : <Subscribe disabled={!enabled} />}
      </Block>
      <Block title="Lojinha" text="Personalizações que ficam com você para sempre.">
        <ul className="flex flex-col gap-3">
          {(Object.entries(SHOP_ITEMS) as [ShopItemKey, (typeof SHOP_ITEMS)[ShopItemKey]][]).map(
            ([key, item]) => (
              <ShopItem
                key={key}
                itemKey={key}
                name={item.name}
                description={item.description}
                price={item.amount}
                owned={items.includes(key)}
                disabled={!enabled}
              />
            ),
          )}
        </ul>
      </Block>
      {(subscription || items.length > 0) && <ManageButton label="Faturas e forma de pagamento" />}
    </div>
  );
}

function Subscribe({ disabled }: { disabled: boolean }) {
  const checkout = useStartCheckout();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {(Object.keys(PLUS_PLAN.prices) as PlanInterval[]).map((interval) => (
          <Button
            key={interval}
            disabled={disabled || checkout.isPending}
            onClick={() =>
              checkout.mutate(
                { kind: "plan", interval },
                { onSuccess: ({ url }) => window.location.assign(url) },
              )
            }
          >
            {formatPrice(PLUS_PLAN.prices[interval].amount)} {INTERVAL_LABEL[interval]}
          </Button>
        ))}
      </div>
      {checkout.error && <p className="text-sm text-danger">{errorMessage(checkout.error)}</p>}
    </div>
  );
}

function ShopItem({
  itemKey,
  name,
  description,
  price,
  owned,
  disabled,
}: {
  itemKey: ShopItemKey;
  name: string;
  description: string;
  price: number;
  owned: boolean;
  disabled: boolean;
}) {
  const checkout = useStartCheckout();
  return (
    <li className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
      <div className="flex flex-col">
        <span className="font-medium">{name}</span>
        <span className="text-sm text-text-muted">{description}</span>
        {checkout.error && (
          <span className="text-sm text-danger">{errorMessage(checkout.error)}</span>
        )}
      </div>
      {owned ? (
        <span className="font-mono text-xs uppercase tracking-wider text-text-muted">Você tem</span>
      ) : (
        <Button
          disabled={disabled || checkout.isPending}
          onClick={() =>
            checkout.mutate(
              { kind: "item", key: itemKey },
              { onSuccess: ({ url }) => window.location.assign(url) },
            )
          }
        >
          {formatPrice(price)}
        </Button>
      )}
    </li>
  );
}

function ManageButton({ label = "Gerenciar assinatura" }: { label?: string }) {
  const portal = useOpenBillingPortal();
  return (
    <div className="flex flex-col gap-2">
      <Button
        disabled={portal.isPending}
        onClick={() =>
          portal.mutate(undefined, { onSuccess: ({ url }) => window.location.assign(url) })
        }
      >
        {label}
      </Button>
      {portal.error && <p className="text-sm text-danger">{errorMessage(portal.error)}</p>}
    </div>
  );
}

function Block({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-b border-border pb-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-medium italic">{title}</h2>
        <p className="text-text-muted">{text}</p>
      </div>
      {children}
    </section>
  );
}
