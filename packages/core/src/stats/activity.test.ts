import { describe, expect, it } from "vitest";
import {
  activityProgress,
  describeActivityGroup,
  feedHeadline,
  type GroupableActivity,
  groupActivities,
} from "./activity";

const HOUR = 60 * 60 * 1000;
const start = new Date("2026-10-19T20:00:00Z").getTime();

function activity(
  id: string,
  kind: GroupableActivity["kind"],
  hoursAgo: number,
  extra: Partial<GroupableActivity> = {},
): GroupableActivity {
  return {
    id,
    kind,
    data: kind === "shelved" ? { status: "want_to_read" } : null,
    actor: { id: "rafa" },
    book: { id: `book-${id}` },
    createdAt: new Date(start - hoursAgo * HOUR),
    ...extra,
  };
}

describe("groupActivities", () => {
  it("collapses a run of books added to the same shelf", () => {
    const groups = groupActivities([
      activity("a", "shelved", 0),
      activity("b", "shelved", 1),
      activity("c", "shelved", 2),
      activity("d", "posted", 3),
    ]);
    expect(groups.map((g) => g.items.map((i) => i.id))).toEqual([["a", "b", "c"], ["d"]]);
  });

  it("keeps different shelves, readers and posts apart", () => {
    const groups = groupActivities([
      activity("a", "shelved", 0),
      activity("b", "shelved", 1, { data: { status: "reading" } }),
      activity("c", "shelved", 2, { actor: { id: "bia" } }),
      activity("d", "posted", 3),
      activity("e", "posted", 4),
    ]);
    expect(groups).toHaveLength(5);
  });

  it("only groups within a day of the newest item", () => {
    const groups = groupActivities([
      activity("a", "finished", 0),
      activity("b", "finished", 20),
      activity("c", "finished", 30),
    ]);
    expect(groups.map((g) => g.items.length)).toEqual([2, 1]);
  });

  it("merges progress on the same book only", () => {
    const sameBook = { book: { id: "duna" } };
    const groups = groupActivities([
      activity("a", "progress", 0, sameBook),
      activity("b", "progress", 1, sameBook),
      activity("c", "progress", 2),
    ]);
    expect(groups.map((g) => g.items.length)).toEqual([2, 1]);
  });
});

describe("describeActivityGroup", () => {
  it("counts books in grouped entries", () => {
    expect(describeActivityGroup("shelved", { status: "want_to_read" }, 3)).toBe(
      "adicionou 3 livros à estante “Quero ler”",
    );
    expect(describeActivityGroup("finished", null, 2)).toBe("terminou de ler 2 livros");
    expect(describeActivityGroup("finished", null, 1)).toBe("terminou de ler");
  });
});

describe("feed cards", () => {
  it("shows progress as a bar with the edition's pages", () => {
    expect(activityProgress({ page: 120 }, 300)).toEqual({
      percent: 40,
      label: "p. 120 de 300",
    });
    expect(activityProgress({ page: 120 }, null)).toEqual({ percent: null, label: "p. 120" });
    expect(activityProgress({ page: 999 }, 300)?.percent).toBe(100);
    expect(activityProgress(null, 300)).toBeNull();
  });

  it("doesn't repeat the page in the headline", () => {
    expect(feedHeadline("progress", { page: 120 }, 1)).toBe("está lendo");
    expect(feedHeadline("finished", null, 3)).toBe("terminou de ler 3 livros");
    expect(feedHeadline("shelved", { status: "abandoned" }, 1)).toBe("abandonou");
    expect(feedHeadline("posted", { postKind: "quote" }, 1)).toBe("guardou uma citação");
    expect(feedHeadline("shelved", { status: "reading" }, 1)).toBe("começou a ler");
    expect(feedHeadline("shelved", { status: "want_to_read" }, 4)).toBe(
      "adicionou 4 livros à estante “Quero ler”",
    );
  });
});
