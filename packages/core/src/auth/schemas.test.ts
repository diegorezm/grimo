import { describe, expect, it } from "vitest";
import {
  emailCredentialsSchema,
  firstIssue,
  forgotPasswordSchema,
  newPasswordSchema,
  resetPasswordSchema,
} from "./schemas";

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

describe("resetPasswordSchema", () => {
  it("wants 8+ characters typed the same twice", () => {
    expect(
      resetPasswordSchema.safeParse({ password: "segredo123", confirm: "segredo123" }).success,
    ).toBe(true);
    const short = resetPasswordSchema.safeParse({ password: "curta", confirm: "curta" });
    expect(short.success || firstIssue(short.error)).toMatch(/8 caracteres/);
    const different = resetPasswordSchema.safeParse({
      password: "segredo123",
      confirm: "segredo124",
    });
    expect(different.success || firstIssue(different.error)).toBe("As senhas não são iguais");
  });

  it("forgot password only needs a valid email", () => {
    expect(forgotPasswordSchema.parse({ email: " Bia@Grimo.Test" })).toEqual({
      email: "bia@grimo.test",
    });
  });
});
