import { describe, expect, it } from "vitest";
import { api } from "../convex/_generated/api";
import { newTest, reader } from "./setup";

describe("notifications", () => {
  it("tells the author about follows, likes, comments and mentions", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    const caio = await reader(t, "caio");

    await bia.as.mutation(api.users.setFollowing, { userId: rafa.id, follow: true });
    const { post } = await rafa.as.mutation(api.posts.create, { kind: "note", body: "Oi!" });
    await bia.as.mutation(api.posts.setLiked, { postId: post.id, like: true });
    // Rafa is the author: "comentou", not a mention too. Caio is mentioned.
    await bia.as.mutation(api.posts.comment, { postId: post.id, body: "@rafa @caio leiam!" });
    // Mentioning yourself and unknown readers does nothing.
    await rafa.as.mutation(api.posts.create, { kind: "note", body: "eu @rafa e @ninguem" });

    const { items } = await rafa.as.query(api.notifications.list, { limit: 20 });
    expect(items.map((item) => item.kind)).toEqual(["comment", "like", "follow"]);
    expect(items[2]).toMatchObject({ actor: { username: "bia" }, followingActor: false });
    expect(items[0]?.comment?.snippet).toBe("@rafa @caio leiam!");
    expect(await rafa.as.query(api.notifications.unreadCount, {})).toBe(3);

    const forCaio = await caio.as.query(api.notifications.list, { limit: 20 });
    expect(forCaio.items).toMatchObject([{ kind: "mention", post: { id: post.id } }]);

    await rafa.as.mutation(api.notifications.markAllRead, {});
    expect(await rafa.as.query(api.notifications.unreadCount, {})).toBe(0);
    expect((await rafa.as.query(api.notifications.list, { limit: 20 })).items[0]?.read).toBe(true);
  });

  it("takes back undone likes and follows, and doesn't notify twice", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    const { post } = await rafa.as.mutation(api.posts.create, { kind: "note", body: "Oi!" });

    for (const like of [true, false, true]) {
      await bia.as.mutation(api.posts.setLiked, { postId: post.id, like });
    }
    await bia.as.mutation(api.users.setFollowing, { userId: rafa.id, follow: true });
    await bia.as.mutation(api.users.setFollowing, { userId: rafa.id, follow: false });

    const { items } = await rafa.as.query(api.notifications.list, { limit: 20 });
    expect(items.map((item) => item.kind)).toEqual(["like"]);
  });

  it("goes away with the comment, the post, or a block", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    const { post } = await rafa.as.mutation(api.posts.create, { kind: "note", body: "Oi!" });
    const { comment } = await bia.as.mutation(api.posts.comment, {
      postId: post.id,
      body: "Boa!",
    });
    await bia.as.mutation(api.posts.setLiked, { postId: post.id, like: true });

    await bia.as.mutation(api.posts.removeComment, { id: comment.id });
    let { items } = await rafa.as.query(api.notifications.list, { limit: 20 });
    expect(items.map((item) => item.kind)).toEqual(["like"]);

    await rafa.as.mutation(api.posts.remove, { id: post.id });
    ({ items } = await rafa.as.query(api.notifications.list, { limit: 20 }));
    expect(items).toEqual([]);

    await bia.as.mutation(api.users.setFollowing, { userId: rafa.id, follow: true });
    await rafa.as.mutation(api.moderation.setBlocked, { userId: bia.id, block: true });
    expect(await rafa.as.query(api.notifications.unreadCount, {})).toBe(0);
  });

  it("is in the data export", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    await bia.as.mutation(api.users.setFollowing, { userId: rafa.id, follow: true });
    const data = await rafa.as.query(api.account.exportData, {});
    expect(data.notifications).toMatchObject([{ kind: "follow", from: "bia" }]);
  });
});
