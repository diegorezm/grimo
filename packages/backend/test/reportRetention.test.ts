import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "../convex/_generated/api";
import { newTest, reader } from "./setup";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-01T12:00:00Z"));
});

afterEach(() => vi.useRealTimers());

describe("report retention", () => {
  it("erases the copied text of closed reports after 180 days, keeping open ones", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const report = (status: "open" | "dismissed" | "actioned", daysAgo: number) =>
      t.run((ctx) =>
        ctx.db.insert("reports", {
          reporterId: rafa.id,
          target: "user",
          targetId: "x",
          targetUserId: null,
          reason: "spam",
          details: "detalhes",
          snapshot: "texto",
          status,
          createdAt: Date.now() - daysAgo * 24 * 60 * 60 * 1000,
          resolvedAt: status === "open" ? null : Date.now(),
        }),
      );
    const old = await report("actioned", 200);
    const recent = await report("dismissed", 30);
    const open = await report("open", 200);

    await t.mutation(internal.moderation.eraseOldReportText, {});

    const rows = await t.run(async (ctx) =>
      Promise.all([old, recent, open].map((id) => ctx.db.get(id))),
    );
    expect(rows.map((row) => row?.snapshot)).toEqual([null, "texto", "texto"]);
    expect(rows[0]).toMatchObject({ details: null, status: "actioned", reason: "spam" });
  });
});
