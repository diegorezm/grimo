import { describe, expect, it } from "vitest";
import { bookSearchTerm, popularReadersLabel, searchSuggestions } from "./suggestions";

describe("search suggestions", () => {
  it("puts trending authors first, without repeats, and fills with the defaults", () => {
    const suggestions = searchSuggestions(["Autora", "autora ", "", "Machado de Assis"]);
    expect(suggestions.slice(0, 3)).toEqual(["Autora", "Machado de Assis", "Clarice Lispector"]);
    expect(suggestions).toHaveLength(6);
  });

  it("narrows the search to a genre", () => {
    expect(bookSearchTerm(" duna ", null)).toBe("duna");
    expect(bookSearchTerm("duna", "science_fiction")).toBe('duna subject:"science fiction"');
    expect(bookSearchTerm("", "humor")).toBe('subject:"humor"');
  });

  it("labels the readers", () => {
    expect(popularReadersLabel(1)).toBe("1 leitor este mês");
    expect(popularReadersLabel(3)).toBe("3 leitores este mês");
  });
});
