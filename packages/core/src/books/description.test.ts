import { describe, expect, it } from "vitest";
import { cleanDescription } from "./description";

describe("cleanDescription", () => {
  it("strips emphasis, links and the trailing source block", () => {
    const text =
      "***The Name of the Wind***, by [Patrick Rothfuss](https://x.org).\n\n----------\nSee also: [1]: https://y";
    expect(cleanDescription(text)).toBe("The Name of the Wind, by Patrick Rothfuss.");
  });
});
