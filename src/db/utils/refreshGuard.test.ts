import { describe, expect, it } from "vitest";
import { requireNonEmpty } from "./refreshGuard";

describe("requireNonEmpty", () => {
  it("fails clearly before an empty upstream source can replace derived data", () => {
    expect(() => requireNonEmpty("ansm_specialite", [])).toThrow(
      "ansm_specialite is empty; refusing to replace derived data",
    );
  });
});
