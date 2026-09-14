import { describe, expect, it } from "vitest";
import { withStaticParamFallback } from "./staticParams";

describe("withStaticParamFallback", () => {
  it("preserves generated parameters", () => {
    const params = [{ letter: "A" }, { letter: "B" }];

    expect(withStaticParamFallback(params, { letter: "Z" })).toBe(params);
  });

  it("returns one validation parameter for an empty dataset", () => {
    expect(withStaticParamFallback([], { letter: "A" })).toEqual([
      { letter: "A" },
    ]);
  });
});
