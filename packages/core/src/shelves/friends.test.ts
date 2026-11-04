import { describe, expect, it } from "vitest";
import { friendsWantLabel, namesLabel } from "./friends";

describe("friendsWantLabel", () => {
  it("names up to two friends by first name and counts the rest", () => {
    expect(friendsWantLabel(["Bia Lima"])).toBe("Bia quer ler");
    expect(friendsWantLabel(["Bia Lima", "Caio"])).toBe("Bia e Caio querem ler");
    expect(friendsWantLabel(["Bia", "Caio", "Ana", "Rafa"])).toBe("Bia, Caio e mais 2 querem ler");
  });
});

describe("namesLabel", () => {
  it("names two friends at most", () => {
    expect(namesLabel(["Bia Lima"])).toBe("Bia");
    expect(namesLabel(["Bia Lima", "Rafa Moreira"])).toBe("Bia e Rafa");
    expect(namesLabel(["Bia", "Rafa", "Caio", "Lu"])).toBe("Bia, Rafa e mais 2");
  });
});
