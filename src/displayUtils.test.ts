import { describe, it, expect } from "vitest";
import { formatSpecName } from "./displayUtils";

describe("formatSpecName", () => {
  it("should lowercase words that start with uppercase", () => {
    expect(formatSpecName("DOLIPRANE 1000 mg")).toBe("Doliprane 1000 mg");
  });

  it("should not crash on empty string", () => {
    expect(formatSpecName("")).toBeFalsy();
  });

  it("should not crash on undefined", () => {
    expect(formatSpecName(undefined as unknown as string)).toBeFalsy();
  });
});
