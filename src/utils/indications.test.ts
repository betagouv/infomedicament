import { describe, it, expect } from "vitest";
import { getIndicationSlug } from "./indications";

describe("utils indications - slug", () => {
  it("builds a slug from the indication name and id", () => {
    expect(getIndicationSlug(42, "Hypertension artérielle")).toBe(
      "hypertension-arterielle-42",
    );
  });
});
