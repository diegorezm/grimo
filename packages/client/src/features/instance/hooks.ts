import { queryOptions, useQuery } from "@tanstack/react-query";
import type { ApiClient } from "../../lib/api-client";
import { useApi } from "../../lib/api-context";
import { parseResponse, queryKeys, staleTimes } from "../../lib/query";

export function instanceQuery(api: ApiClient) {
  return queryOptions({
    queryKey: queryKeys.instance,
    queryFn: () => parseResponse(api.instance.$get()),
    staleTime: staleTimes.instance,
  });
}

/**
 * Info about the server this client talks to (official or self-hosted).
 * UI adapts to it: hide sign-up when closed, hide social features in personal mode.
 */
export function useInstance() {
  return useQuery(instanceQuery(useApi()));
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
