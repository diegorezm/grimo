import { api, type Id } from "@grimo/backend";
import { buildGroupCard } from "@grimo/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FunctionReturnType } from "convex/server";
import { convexQuery, convexQueryPrefix } from "../../lib/convex-cache";
import { useGrowingList } from "../../lib/list";
import { usePatchQueries } from "../../lib/mutation";
import { useConvexCache } from "../../lib/provider";
import { PAGE_SIZE } from "../../lib/query";
import type { BookSearchResult } from "../books/hooks";
import { meQuery, useMe } from "../profiles/hooks";

export type GroupList = FunctionReturnType<typeof api.groups.mine>;
export type GroupSummary = GroupList["items"][number];
export type GroupDetail = FunctionReturnType<typeof api.groups.detail>;
export type GroupMember = GroupDetail["members"][number];
export type GroupInvite = NonNullable<FunctionReturnType<typeof api.groups.byCode>>;
export type GroupMessagePage = FunctionReturnType<typeof api.groups.messages>;
export type GroupMessage = GroupMessagePage["items"][number];

const groupId = (id: string) => id as Id<"groups">;

/** Every cached page (any `limit`) of one group's conversation: keys match args partially. */
const messagesOf = (id: string) => [...convexQueryPrefix(api.groups.messages), { id }];

/** Your reading groups (the Juntos tab; route loaders prefetch it). */
export function groupsQuery() {
  return convexQuery(api.groups.mine, {}, "required");
}

export function useGroups() {
  return useQuery(groupsQuery());
}

export function groupQuery(id: string) {
  return convexQuery(api.groups.detail, { id: groupId(id) }, "required");
}

/** One group from inside: members side by side, date and invite. Live. */
export function useGroup(id: string) {
  return useQuery(groupQuery(id));
}

/** The group's story card ("Lendo juntos" / "Terminamos juntos"), once the group is loaded. */
export function useGroupCard(id: string) {
  const group = useGroup(id).data;
  const username = useMe().data?.username ?? null;
  return group ? buildGroupCard(group, username, new Date()) : null;
}

/** What an invite link shows; works signed out too (null: wrong or expired code). */
export function inviteQuery(code: string) {
  return convexQuery(api.groups.byCode, { code }, "optional");
}

export function useInvite(code: string) {
  return useQuery(inviteQuery(code));
}

/** First page of a group's conversation (route loaders prefetch it). */
export function groupMessagesQuery(id: string) {
  return convexQuery(api.groups.messages, { id: groupId(id), limit: PAGE_SIZE }, "required");
}

/** The conversation, newest first; messages past your progress come without text. Live. */
export function useGroupMessages(id: string) {
  return useGrowingList(api.groups.messages, { id: groupId(id) }, "required");
}

/** Starts a group for a book (it goes to "Lendo"). Resolves with the new group's id. */
export function useCreateGroup() {
  const { convex } = useConvexCache();
  return useMutation({
    mutationFn: ({ book, finishBy }: { book: BookSearchResult; finishBy: number | null }) =>
      convex.mutation(api.groups.create, { book, finishBy }),
  });
}

/** Joins by code or link. Resolves with the group, your shelf entry and the book. */
export function useJoinGroup() {
  const { convex } = useConvexCache();
  return useMutation({
    mutationFn: (code: string) => convex.mutation(api.groups.join, { code }),
  });
}

/** Leaves a group: it disappears from your list at once. */
export function useLeaveGroup() {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: (id: string) => convex.mutation(api.groups.leave, { id: groupId(id) }),
    onMutate: (id) =>
      patchQueries<GroupList>([convexQueryPrefix(api.groups.mine)], (data) => ({
        ...data,
        items: data.items.filter((item) => item.id !== id),
      })),
    onError: (_error, _id, rollback) => rollback?.(),
  });
}

export function useRemoveGroupMember(id: string) {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: (userId: string) =>
      convex.mutation(api.groups.removeMember, {
        id: groupId(id),
        userId: userId as Id<"users">,
      }),
    onMutate: (userId) =>
      patchQueries<GroupDetail>([convexQueryPrefix(api.groups.detail)], (data) =>
        data.id === id
          ? { ...data, members: data.members.filter((member) => member.id !== userId) }
          : data,
      ),
    onError: (_error, _userId, rollback) => rollback?.(),
  });
}

export function useSetGroupFinishBy(id: string) {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: (finishBy: number | null) =>
      convex.mutation(api.groups.setFinishBy, { id: groupId(id), finishBy }),
    onMutate: (finishBy) =>
      patchQueries<GroupDetail>([convexQueryPrefix(api.groups.detail)], (data) =>
        data.id === id ? { ...data, finishBy } : data,
      ),
    onError: (_error, _finishBy, rollback) => rollback?.(),
  });
}

/** Sends a message; it shows up at once at your current progress (the server confirms). */
export function useSendGroupMessage(id: string) {
  const { convex } = useConvexCache();
  const queryClient = useQueryClient();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: (body: string) => convex.mutation(api.groups.send, { id: groupId(id), body }),
    onMutate: (body) => {
      const me = queryClient.getQueryData(meQuery().queryKey);
      if (!me) return undefined;
      return patchQueries<GroupMessagePage>([messagesOf(id)], (data) => {
        const message: GroupMessage = {
          id: `pending-${Date.now()}` as GroupMessage["id"],
          author: {
            id: me.id,
            name: me.name,
            username: me.username,
            image: me.image,
            role: me.role,
          },
          mine: true,
          percent: data.myPercent,
          body: body.trim(),
          createdAt: Date.now(),
        };
        return { ...data, items: [message, ...data.items] };
      });
    },
    onError: (_error, _body, rollback) => rollback?.(),
  });
}

export function useRemoveGroupMessage() {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: (messageId: string) =>
      convex.mutation(api.groups.removeMessage, { id: messageId as Id<"groupMessages"> }),
    onMutate: (messageId) =>
      patchQueries<GroupMessagePage>([convexQueryPrefix(api.groups.messages)], (data) => ({
        ...data,
        items: data.items.filter((item) => item.id !== messageId),
      })),
    onError: (_error, _messageId, rollback) => rollback?.(),
  });
}
