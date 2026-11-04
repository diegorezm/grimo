import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "../convex/_generated/api";
import { newTest, reader } from "./setup";

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ docs: [] }))),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("report outcome", () => {
  it("tells every reporter that moderation looked at it, without saying what was done", async () => {
    const t = newTest();
    const mod = await reader(t, "mod");
    const rafa = await reader(t, "rafa");
    const bia = await reader(t, "bia");
    const theo = await reader(t, "theo");
    await t.mutation(internal.moderation.setAdmin, { username: "mod", admin: true });

    const { post } = await rafa.as.mutation(api.posts.create, { kind: "note", body: "spam!" });
    for (const who of [bia, theo]) {
      await who.as.mutation(api.moderation.report, {
        target: "post",
        targetId: post.id,
        reason: "spam",
      });
    }
    const { post: fine } = await rafa.as.mutation(api.posts.create, { kind: "note", body: "ok" });
    await bia.as.mutation(api.moderation.report, {
      target: "post",
      targetId: fine.id,
      reason: "other",
      details: "achei estranho",
    });

    const { items: reports } = await mod.as.query(api.moderation.reports, {
      page: 1,
      pageSize: 20,
    });
    const spam = reports.find((report) => report.snippet === "spam!")!;
    const other = reports.find((report) => report.snippet === "ok")!;
    await mod.as.mutation(api.moderation.act, { reportId: spam.id, action: "remove" });
    await mod.as.mutation(api.moderation.act, { reportId: other.id, action: "dismiss" });

    const kinds = async (who: typeof bia) =>
      (await who.as.query(api.notifications.list, { limit: 20 })).items.map((n) => n.kind);
    expect(await kinds(bia)).toEqual(["report_dismissed", "report_actioned"]);
    expect(await kinds(theo)).toEqual(["report_actioned"]);
    // The reported reader hears nothing from the reports.
    expect(await kinds(rafa)).toEqual([]);
  });
});
