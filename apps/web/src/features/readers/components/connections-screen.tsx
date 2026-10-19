import { type ConnectionKind, useReader } from "@grimo/client";
import { Link } from "@tanstack/react-router";
import { Screen } from "@/components/layout/screen";
import { cn } from "@/utils/cn";
import { ConnectionsList } from "./connections-list";

/** Followers / following of a reader, with tabs to switch between the two lists. */
export function ConnectionsScreen({
  username,
  kind,
  viewerId,
}: {
  username: string;
  kind: ConnectionKind;
  viewerId: string | null;
}) {
  const reader = useReader(username);
  const profile = reader.data?.profile;
  const tabs = [
    { kind: "followers", label: "Seguidores", count: profile?.followers },
    { kind: "following", label: "Seguindo", count: profile?.following },
  ] as const;

  return (
    <Screen back="Voltar" title={profile?.name ?? `@${username}`} subtitle={`@${username}`}>
      <div className="flex flex-col gap-6">
        <nav aria-label="Conexões" className="flex gap-1 border-b border-border">
          {tabs.map((tab) => (
            <Link
              key={tab.kind}
              to={tab.kind === "followers" ? "/u/$username/followers" : "/u/$username/following"}
              params={{ username }}
              replace
              aria-current={tab.kind === kind ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-4 py-2.5 font-mono text-xs uppercase tracking-wider transition",
                tab.kind === kind
                  ? "border-accent text-text"
                  : "border-transparent text-text-muted hover:text-text",
              )}
            >
              {tab.label}
              {tab.count !== undefined && <span className="ml-2 text-text-muted">{tab.count}</span>}
            </Link>
          ))}
        </nav>
        <ConnectionsList key={kind} username={username} kind={kind} viewerId={viewerId} />
      </div>
    </Screen>
  );
}
