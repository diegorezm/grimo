import { describe, expect, it } from "vitest";
import { bookCountLabel, listNoteSchema, listSchema } from "./index";

describe("lists", () => {
  it("needs a name and keeps the description short", () => {
    expect(listSchema.parse({ title: "  Terror para começar " })).toEqual({
      title: "Terror para começar",
      description: "",
    });
    expect(listSchema.safeParse({ title: " " }).success).toBe(false);
    expect(listSchema.safeParse({ title: "x", description: "a".repeat(501) }).success).toBe(false);
  });

  it("turns an empty note into none", () => {
    expect(listNoteSchema.parse("  ")).toBeNull();
    expect(listNoteSchema.parse(" Assustador ")).toBe("Assustador");
    expect(bookCountLabel(1)).toBe("1 livro");
  });
});
