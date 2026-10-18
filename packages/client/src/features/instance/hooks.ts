import { useQuery } from "@tanstack/react-query";
import { useApi } from "../../lib/api-context";
import { parseResponse, queryKeys } from "../../lib/query";

/**
 * Info about the server this client talks to (official or self-hosted).
 * UI adapts to it: hide sign-up when closed, hide social features in personal mode.
 */
export function useInstance() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.instance,
    queryFn: () => parseResponse(api.instance.$get()),
    staleTime: 5 * 60_000,
  });
}

/** Checks that a URL points to a Grimo server. Used by the mobile server picker. */
export async function probeInstance(baseUrl: string) {
  const res = await fetch(`${baseUrl}/api/instance`);
  if (!res.ok) throw new Error(`Servidor respondeu ${res.status}`);
  const info = (await res.json()) as { name?: unknown; mode?: unknown };
  if (typeof info.name !== "string" || typeof info.mode !== "string") {
    throw new Error("Isso não parece um servidor Grimo");
  }
  return info as { name: string; mode: string };
}
