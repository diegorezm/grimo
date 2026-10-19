import { describe, expect, it } from "vitest";
import { emailCredentialsSchema, firstIssue, newPasswordSchema } from "./schemas";

describe("emailCredentialsSchema", () => {
  it("normalizes the email", () => {
    expect(emailCredentialsSchema.parse({ email: "  Bia@Grimo.Test ", password: "x" })).toEqual({
      email: "bia@grimo.test",
      password: "x",
    });
  });

  it("explains what's wrong in pt-BR", () => {
    const result = emailCredentialsSchema.safeParse({ email: "bia", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) expect(firstIssue(result.error)).toBe("Esse email não parece válido");
  });
});

describe("newPasswordSchema", () => {
  it("asks for 8+ characters", () => {
    expect(newPasswordSchema.safeParse("1234567").success).toBe(false);
    expect(newPasswordSchema.safeParse("12345678").success).toBe(true);
  });
});
