import { api, type Id } from "@grimo/backend";
import {
  avatarProblem,
  deviceTimeZone,
  type SetupProfileInput,
  type UpdateProfileInput,
  yearOf,
} from "@grimo/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useRef } from "react";
import { CONVEX_QUERY, convexQuery, convexQueryPrefix } from "../../lib/convex-cache";
import { useGrowingList } from "../../lib/list";
import { usePatchQueries } from "../../lib/mutation";
import { useConvexCache } from "../../lib/provider";
import { PAGE_SIZE } from "../../lib/query";
import {
  type AgreementInput,
  agreementArgs,
  applyAcceptance,
  type LegalSource,
} from "../legal/hooks";
import { followInNotifications, type NotificationPage } from "../notifications/hooks";

/**
 * The signed-in reader. `needsSetup`: the onboarding hasn't asked for name and @ yet; `legal`:
 * terms to accept again, age to declare, or declared under 16.
 */
export type Me = FunctionReturnType<typeof api.users.me>;
/** A reader's public profile. */
export type Profile = Omit<Me, "needsSetup" | "legal" | "timeZone" | "needsEmailVerification">;
export type ReaderPage = FunctionReturnType<typeof api.users.byUsername>;
export type ReaderActivityPage = FunctionReturnType<typeof api.users.activity>;
export type ConnectionKind = "followers" | "following";
export type ReaderCard = FunctionReturnType<typeof api.users.connections>["items"][number];
export type ReaderSuggestion = FunctionReturnType<typeof api.users.suggestions>["items"][number];

export function meQuery() {
  return convexQuery(api.users.me, {}, "required");
}

/** A reader's public page; `year` picks the stats shown (defaults to this year). */
export function readerQuery(username: string, year = yearOf(new Date())) {
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

/**
 * A photo ready to upload. `send` POSTs the bytes to the upload URL (with `contentType` as
 * Content-Type) and returns the response body: each platform sends files its own way
 * (web: `fetch` with a Blob; React Native: a native file upload, since RN Blobs are unreliable).
 */
export interface AvatarFile {
  contentType: string;
  size: number;
  send: (uploadUrl: string) => Promise<string>;
}

/**
 * Uploads a profile photo: checks it, gets an upload URL, sends the file to Convex file storage
 * and makes it the reader's photo. Platforms only pick, shrink and send the image.
 */
export function useUploadAvatar() {
  const { convex } = useConvexCache();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ contentType, size, send }: AvatarFile) => {
      const problem = avatarProblem({ contentType, size });
      if (problem) throw new Error(problem);
      const uploadUrl = await convex.mutation(api.users.avatarUploadUrl, {});
      const { storageId } = JSON.parse(await send(uploadUrl)) as { storageId: Id<"_storage"> };
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

/**
 * Onboarding: saves name and @, the age declaration and the acceptance of the terms, and ends
 * the setup (the app opens normally afterwards). Under 16, `result.ok` is false and `me` says
 * `legal.underage` instead.
 */
export function useCompleteSetup(source: LegalSource) {
  const { convex } = useConvexCache();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, username, ...agreement }: SetupProfileInput & AgreementInput) =>
      convex.mutation(api.users.completeSetup, {
        name,
        username,
        ...agreementArgs(agreement, source),
      }),
    onSuccess: (result, { name, username }) =>
      queryClient.setQueryData(meQuery().queryKey, (me) =>
        !me
          ? me
          : result.ok
            ? { ...applyAcceptance(me, result), name, username, needsSetup: false }
            : applyAcceptance(me, result),
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
      const [readers, notifications] = await Promise.all([
        patchQueries<unknown>(keys, (data) => patchFollow(data, userId, follow)),
        patchQueries<NotificationPage>([convexQueryPrefix(api.notifications.list)], (data) =>
          followInNotifications(data, userId, follow),
        ),
      ]);
      return () => {
        readers();
        notifications();
      };
    },
    onError: (_error, _input, rollback) => rollback?.(),
  });
}

/**
 * Tells the server which time zone this device is in, so the months and years of reading follow
 * the reader (travel, a new phone). Mount it once while signed in; tries once per zone per run.
 */
export function useSyncTimeZone(enabled = true) {
  const { convex } = useConvexCache();
  const stored = useMe({ enabled }).data?.timeZone;
  const tried = useRef<string | null>(null);
  useEffect(() => {
    const device = deviceTimeZone();
    if (stored === undefined || stored === device || tried.current === device) return;
    tried.current = device;
    convex.mutation(api.users.setTimeZone, { timeZone: device }).catch(() => {
      tried.current = null;
    });
  }, [convex, stored]);
}
