import { describe, expect, it } from "vitest";
import { feelingsSavedMessage, ratingSavedMessage, shelfMoveMessage } from "./messages";

describe("action notices", () => {
  it("say where the book went", () => {
    expect(shelfMoveMessage("Duna", "reading")).toBe("Duna foi para Lendo");
    expect(shelfMoveMessage("Duna", "read")).toBe("Duna está nos seus Lidos");
  });

  it("say what was saved, or that it was cleared", () => {
    expect(ratingSavedMessage(4.5)).toBe("Nota 4,5 salva");
    expect(ratingSavedMessage(null)).toBe("Nota apagada");
    expect(feelingsSavedMessage(["tensao", "medo"])).toBe("Sentimentos salvos: Tensão, Medo");
    expect(feelingsSavedMessage([])).toBe("Sentimentos apagados");
  });
});
