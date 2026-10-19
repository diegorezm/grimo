import { type QueryClient, type QueryKey, useQueryClient } from "@tanstack/react-query";

/**
 * Applies `update` to every cached query under each prefix right away and returns a rollback.
 * Mutations call it in `onMutate`: the UI reacts before the server answers (offline too), and
 * Convex subscriptions bring the server's truth once the mutation settles.
 */
export async function patchQueries<T>(
  queryClient: QueryClient,
  prefixes: QueryKey[],
  update: (data: T) => T,
) {
  await Promise.all(prefixes.map((queryKey) => queryClient.cancelQueries({ queryKey })));
  const previous = prefixes.flatMap((queryKey) => queryClient.getQueriesData<T>({ queryKey }));
  for (const queryKey of prefixes) {
    queryClient.setQueriesData<T>({ queryKey }, (data) =>
      data === undefined ? data : update(data),
    );
  }
  return () => {
    for (const [key, data] of previous) queryClient.setQueryData(key, data);
  };
}

export function usePatchQueries() {
  const queryClient = useQueryClient();
  return <T>(prefixes: QueryKey[], update: (data: T) => T) =>
    patchQueries(queryClient, prefixes, update);
}
