import { describe, expect, it } from "vitest";
import {
  canSeeMessage,
  createGroupSchema,
  groupMessageSchema,
  groupPace,
  groupPercent,
  memberPercent,
  membersLabel,
  newInviteCode,
  paceLabel,
  parseInviteCode,
} from "./index";

describe("invite codes", () => {
  it("makes 8-character codes from the safe alphabet", () => {
    const code = newInviteCode(() => 0.5);
    expect(code).toHaveLength(8);
    expect(parseInviteCode(code)).toBe(code);
  });

  it("reads the code from a link or the code itself", () => {
    expect(parseInviteCode("https://grimo.app/j/abcd2345")).toBe("abcd2345");
    expect(parseInviteCode("  ABCD2345 ")).toBe("abcd2345");
    expect(parseInviteCode("http://localhost:5173/j/abcd2345?x=1")).toBe("abcd2345");
    expect(parseInviteCode("abcd")).toBeNull();
    // "l", "o", "0" and "1" are never in a code.
    expect(parseInviteCode("abcd0l1o")).toBeNull();
  });
});

describe("memberPercent", () => {
  it("uses the reader's edition, and read is 100", () => {
    expect(memberPercent({ status: "reading", currentPage: 100, pageCount: 400 }, 200)).toBe(25);
    expect(memberPercent({ status: "reading", currentPage: 100 }, 200)).toBe(50);
    expect(memberPercent({ status: "read", currentPage: 0 }, null)).toBe(100);
    expect(memberPercent(null, 200)).toBe(0);
    expect(memberPercent({ status: "reading", currentPage: 50 }, null)).toBe(0);
  });
});

describe("spoilers", () => {
  it("opens a message once you read as far as its author", () => {
    expect(canSeeMessage(40, 39)).toBe(false);
    expect(canSeeMessage(40, 40)).toBe(true);
  });
});

describe("groupPace", () => {
  const now = new Date("2026-11-01T12:00:00Z");
  const in10days = now.getTime() + 10 * 24 * 60 * 60 * 1000;

  it("spreads the pages left over the days left", () => {
    const pace = groupPace(in10days, { percent: 50, currentPage: 150, pages: 300 }, now);
    expect(pace).toEqual({ daysLeft: 10, pagesPerDay: 15, percentPerDay: 5 });
    expect(paceLabel(pace!)).toBe("Faltam 10 dias · 15 páginas por dia");
  });

  it("falls back to percent without pages, and is null without a date or when done", () => {
    expect(paceLabel(groupPace(in10days, { percent: 0, currentPage: 0, pages: null }, now)!)).toBe(
      "Faltam 10 dias · 10% por dia",
    );
    expect(groupPace(null, { percent: 0, currentPage: 0, pages: 300 }, now)).toBeNull();
    expect(groupPace(in10days, { percent: 100, currentPage: 300, pages: 300 }, now)).toBeNull();
  });
});

describe("labels and schemas", () => {
  it("averages the group and names who is in it", () => {
    expect(groupPercent([10, 20, 31])).toBe(20);
    expect(membersLabel(["Bia Lima"], true)).toBe("Você e Bia");
    expect(membersLabel(["Bia", "Caio", "Ana"], true)).toBe("Você, Bia e mais 2");
  });

  it("rejects dates in the past and empty messages", () => {
    expect(createGroupSchema.safeParse({ finishBy: Date.now() - 1000 }).success).toBe(false);
    expect(createGroupSchema.safeParse({ finishBy: null }).success).toBe(true);
    expect(groupMessageSchema.safeParse({ body: "   " }).success).toBe(false);
  });
});
