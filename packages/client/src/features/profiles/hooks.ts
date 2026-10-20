import { api, type Id } from "@grimo/backend";
import { avatarProblem, type SetupProfileInput, type UpdateProfileInput } from "@grimo/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FunctionReturnType } from "convex/server";
import { useRef } from "react";
import { CONVEX_QUERY, convexQuery } from "../../lib/convex-cache";
import { useGrowingList } from "../../lib/list";
import { usePatchQueries } from "../../lib/mutation";
import { useConvexCache } from "../../lib/provider";
import { PAGE_SIZE } from "../../lib/query";

/** The signed-in reader (`needsSetup`: the onboarding hasn't asked for name and @ yet). */
export type Me = FunctionReturnType<typeof api.users.me>;
/** A reader's public profile. */
export type Profile = Omit<Me, "needsSetup">;
export type ReaderPage = FunctionReturnType<typeof api.users.byUsername>;
export type ReaderActivityPage = FunctionReturnType<typeof api.users.activity>;
export type ConnectionKind = "followers" | "following";
export type ReaderCard = FunctionReturnType<typeof api.users.connections>["items"][number];
export type ReaderSuggestion = FunctionReturnType<typeof api.users.suggestions>["items"][number];

export function meQuery() {
  return convexQuery(api.users.me, {}, "required");
}

/** A reader's public page; `year` picks the stats shown (defaults to this year). */
export function readerQuery(username: string, year = new Date().getUTCFullYear()) {
  return convexQuery(api.users.byUsername, { username, year }, "optional");
}

export function useMe(options: { enabled?: boolean } = {}) {
  return useQuery({ ...meQuery(), ...options });
}

/** Key of the profile update mutation (lets a pinned "Salvar" button show progress). */
export const updateMeMutationKey = ["me", "update"] as const;

export function useUpdateMe() {
  const { convex } = useConvexCache();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: updateMeMutationKey,
    mutationFn: (input: UpdateProfileInput) => convex.mutation(api.users.updateMe, input),
    onSuccess: (profile) =>
      queryClient.setQueryData(meQuery().queryKey, (me) => (me ? { ...me, ...profile } : me)),
  });
}

/** A photo ready to upload: the file's bytes and its MIME type. */
export interface AvatarFile {
  body: Blob;
  contentType: string;
}

/**
 * Uploads a profile photo: gets an upload URL, POSTs the bytes to Convex file storage and
 * makes it the reader's photo. Platforms only pick and shrink the image (web: File, mobile: URI).
 */
export function useUploadAvatar() {
  const { convex } = useConvexCache();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ body, contentType }: AvatarFile) => {
      const problem = avatarProblem({ contentType, size: body.size });
      if (problem) throw new Error(problem);
      const uploadUrl = await convex.mutation(api.users.avatarUploadUrl, {});
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": contentType },
        body,
      });
      if (!res.ok) throw new Error("Não foi possível enviar a foto");
      const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
      return convex.mutation(api.users.setAvatar, { storageId });
    },
    onSuccess: (profile) =>
      queryClient.setQueryData(meQuery().queryKey, (me) => (me ? { ...me, ...profile } : me)),
  });
}

/** Removes the uploaded photo (initials are shown instead). */
export function useRemoveAvatar() {
  const { convex } = useConvexCache();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => convex.mutation(api.users.removeAvatar, {}),
    onSuccess: (profile) =>
      queryClient.setQueryData(meQuery().queryKey, (me) => (me ? { ...me, ...profile } : me)),
  });
}

/** Whether an @ is valid and free (yours counts as free). Skipped until it looks valid. */
export function useUsernameAvailable(username: string) {
  const value = username.trim().toLowerCase();
  return useQuery({
    ...convexQuery(api.users.usernameAvailable, { username: value }, "optional"),
    enabled: value.length >= 3,
  });
}

/** Onboarding: saves name and @ and ends the setup (the app opens normally afterwards). */
export function useCompleteSetup() {
  const { convex } = useConvexCache();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SetupProfileInput) => convex.mutation(api.users.completeSetup, input),
    onSuccess: (_result, input) =>
      queryClient.setQueryData(meQuery().queryKey, (me) =>
        me ? { ...me, ...input, needsSetup: false } : me,
      ),
  });
}

export function useReader(username: string) {
  return useQuery({ ...readerQuery(username), enabled: Boolean(username) });
}

/** First pages of the reader lists, for route loaders to prefetch (same keys as the hooks). */
export const readerActivityQuery = (username: string) =>
  convexQuery(api.users.activity, { username, limit: PAGE_SIZE }, "optional");
export const readerConnectionsQuery = (username: string, kind: ConnectionKind) =>
  convexQuery(api.users.connections, { username, kind, limit: PAGE_SIZE }, "optional");
export const readerSearchQuery = (q: string) =>
  convexQuery(api.users.search, { q: q.trim(), limit: PAGE_SIZE }, "required");
export const readerSuggestionsQuery = () =>
  convexQuery(api.users.suggestions, { limit: PAGE_SIZE }, "required");

/** A reader's own activity (posts, progress, finished books…), newest first. */
export function useReaderActivity(username: string) {
  return useGrowingList(api.users.activity, { username }, "optional");
}

/** Who follows a reader, or whom they follow. */
export function useReaderConnections(username: string, kind: ConnectionKind) {
  return useGrowingList(api.users.connections, { username, kind }, "optional");
}

/** Readers whose name or @username matches `q`. */
export function useReaderSearch(q: string) {
  const text = q.trim();
  return useGrowingList(api.users.search, { q: text }, "required", { enabled: text.length > 0 });
}

/**
 * Everyone you don't follow yet, best matches first. Live, but a reader you just followed stays
 * in place (now "Seguindo") until you leave, instead of vanishing under your cursor.
 */
export function useReaderSuggestions() {
  const list = useGrowingList(api.users.suggestions, {}, "required");
  const shown = useRef(new Map<string, ReaderSuggestion>());
  const items = list.data?.items;
  if (!items) return list;

  const current = new Set<string>(items.map((reader) => reader.id));
  const merged: ReaderSuggestion[] = [];
  for (const [id, reader] of shown.current) {
    if (!current.has(id)) merged.push({ ...reader, isFollowing: true });
  }
  const order = [...shown.current.keys()];
  merged.push(...items);
  merged.sort((a, b) => rank(order, a.id) - rank(order, b.id));
  shown.current = new Map(merged.map((reader) => [reader.id, reader]));
  return { ...list, data: { ...list.data!, items: merged } };
}

/** Position in the list as first shown; new readers go after the ones already on screen. */
const rank = (order: string[], id: string) => {
  const index = order.indexOf(id);
  return index === -1 ? order.length : index;
};

type FollowState = { id: string; isFollowing: boolean; followers: number };

/** Sets `isFollowing` (and the follower count) of `userId` wherever it appears in `data`. */
function patchFollow(data: unknown, userId: string, follow: boolean): unknown {
  if (!data || typeof data !== "object") return data;
  const patch = <T extends FollowState>(reader: T): T =>
    reader.id === userId && reader.isFollowing !== follow
      ? { ...reader, isFollowing: follow, followers: reader.followers + (follow ? 1 : -1) }
      : reader;

  if ("items" in data && Array.isArray(data.items)) {
    return {
      ...data,
      items: data.items.map((item: FollowState) =>
        item && typeof item === "object" && "isFollowing" in item ? patch(item) : item,
      ),
    };
  }
  if ("profile" in data && "isFollowing" in data) {
    const page = data as ReaderPage;
    if (page.profile.id !== userId || page.isFollowing === follow) return page;
    return {
      ...page,
      isFollowing: follow,
      profile: { ...page.profile, followers: page.profile.followers + (follow ? 1 : -1) },
    };
  }
  return data;
}

/** Every cached reader query (`users:*`): pages, search, suggestions, follower lists. */
const readerQueries = [CONVEX_QUERY, "users:"] as const;

/**
 * Follow/unfollow from anywhere (profile, search, suggestions, follower lists): every cached
 * reader list and page shows the new state immediately (rolled back on error).
 */
export function useToggleFollow() {
  const { convex } = useConvexCache();
  const queryClient = useQueryClient();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: ({ userId, follow }: { userId: string; follow: boolean }) =>
      convex.mutation(api.users.setFollowing, { userId: userId as Id<"users">, follow }),
    onMutate: async ({ userId, follow }) => {
      const keys = queryClient
        .getQueryCache()
        .findAll({
          predicate: ({ queryKey }) =>
            queryKey[0] === readerQueries[0] &&
            typeof queryKey[1] === "string" &&
            queryKey[1].startsWith(readerQueries[1]),
        })
        .map((query) => query.queryKey);
      return patchQueries<unknown>(keys, (data) => patchFollow(data, userId, follow));
    },
    onError: (_error, _input, rollback) => rollback?.(),
  });
}
