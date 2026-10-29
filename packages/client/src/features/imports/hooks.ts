import { api } from "@grimo/backend";
import type { ImportedBook } from "@grimo/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { FunctionReturnType } from "convex/server";
import { convexQuery } from "../../lib/convex-cache";
import { useConvexCache } from "../../lib/provider";

export type ShelfImport = NonNullable<FunctionReturnType<typeof api.imports.latest>>;

/** Your latest shelf import (null: never imported). Live while it runs. */
export function latestImportQuery() {
  return convexQuery(api.imports.latest, {}, "required");
}

export function useLatestImport() {
  return useQuery(latestImportQuery());
}

/** Sends the parsed books; the server shelves them in the background. */
export function useStartImport() {
  const { convex } = useConvexCache();
  return useMutation({
    mutationFn: (books: ImportedBook[]) => convex.mutation(api.imports.start, { books }),
  });
}
