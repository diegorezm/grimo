import { describe, expect, it } from "vitest";
import { ageOn, birthDateFromBR, isOldEnough, maskBirthDate, parseBirthDate } from "./age";
import { reportSchema } from "./reports";
import { deleteConfirmationMatches, legalAcceptanceSchema } from "./schemas";

const at = (date: string) => Date.parse(`${date}T12:00:00Z`);

describe("ageOn", () => {
  it("counts full years, the birthday included", () => {
    expect(ageOn("2010-10-19", at("2026-10-19"))).toBe(16);
    expect(ageOn("2010-10-20", at("2026-10-19"))).toBe(15);
    expect(ageOn("2010-11-01", at("2026-10-19"))).toBe(15);
  });

  it("handles leap days", () => {
    expect(ageOn("2008-02-29", at("2024-02-28"))).toBe(15);
    expect(ageOn("2008-02-29", at("2024-02-29"))).toBe(16);
  });

  it("rejects dates that don't exist", () => {
    expect(parseBirthDate("2010-02-30")).toBeNull();
    expect(parseBirthDate("19/10/2010")).toBeNull();
    expect(ageOn("nope", at("2026-10-19"))).toBeNull();
  });

  it("requires 16 years", () => {
    expect(isOldEnough("2010-10-19", at("2026-10-19"))).toBe(true);
    expect(isOldEnough("2011-01-01", at("2026-10-19"))).toBe(false);
  });
});

describe("legalAcceptanceSchema", () => {
  const base = { termsVersion: "1", privacyVersion: "1" };

  it("requires the box to be checked", () => {
    expect(legalAcceptanceSchema.safeParse({ ...base, accepted: false }).success).toBe(false);
    expect(legalAcceptanceSchema.safeParse({ ...base, accepted: true }).success).toBe(true);
  });

  it("validates the birth date", () => {
    const parse = (birthDate: string) =>
      legalAcceptanceSchema.safeParse({ ...base, accepted: true, birthDate }).success;
    expect(parse("2000-01-31")).toBe(true);
    expect(parse("2000-13-01")).toBe(false);
    expect(parse("1800-01-01")).toBe(false);
  });
});

describe("reportSchema", () => {
  it("asks for details when the reason is 'other'", () => {
    const report = { target: "post", targetId: "x", reason: "other" } as const;
    expect(reportSchema.safeParse(report).success).toBe(false);
    expect(reportSchema.safeParse({ ...report, details: "Golpe" }).success).toBe(true);
  });
});

describe("deleteConfirmationMatches", () => {
  it("accepts the @ with or without the sign, any case", () => {
    expect(deleteConfirmationMatches(" @Rafa ", "rafa")).toBe(true);
    expect(deleteConfirmationMatches("rafa2", "rafa")).toBe(false);
  });
});

describe("birth date typing (mobile)", () => {
  it("masks digits and converts to ISO", () => {
    expect(maskBirthDate("1910")).toBe("19/10");
    expect(maskBirthDate("19102010")).toBe("19/10/2010");
    expect(birthDateFromBR("19/10/2010")).toBe("2010-10-19");
    expect(birthDateFromBR("19/10")).toBe("19/10");
  });
});
