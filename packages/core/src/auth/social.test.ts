import { describe, expect, it } from "vitest";
import { socialSignInError } from "./social";

describe("socialSignInError", () => {
  it("explains an email that already has an unconfirmed password account", () => {
    expect(socialSignInError("account_not_linked")).toMatch(/já tem uma conta com senha/);
  });

  it("has nothing to say without an error, and a generic message otherwise", () => {
    expect(socialSignInError(undefined)).toBeNull();
    expect(socialSignInError("internal_server_error")).toMatch(/Tente de novo/);
  });
});
