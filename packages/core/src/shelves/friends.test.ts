import { describe, expect, it } from "vitest";
import { friendsWantLabel } from "./friends";

describe("friendsWantLabel", () => {
  it("names up to two friends by first name and counts the rest", () => {
    expect(friendsWantLabel(["Bia Lima"])).toBe("Bia quer ler");
    expect(friendsWantLabel(["Bia Lima", "Caio"])).toBe("Bia e Caio querem ler");
    expect(friendsWantLabel(["Bia", "Caio", "Ana", "Rafa"])).toBe("Bia, Caio e mais 2 querem ler");
  });
});
