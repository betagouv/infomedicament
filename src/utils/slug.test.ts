import { describe, it, expect } from "vitest";
import { getIdFromSlug, getSlug } from "./slug";

describe("slug", () => {
  it("builds a slug from the name and the identifier", () => {
    expect(getSlug(60234100, "DOLIPRANE 1000 mg, comprimé")).toBe(
      "doliprane-1000-mg-comprime-60234100",
    );
  });

  it("falls back to the identifier when the name is empty", () => {
    expect(getSlug(42, "")).toBe("42");
  });

  it("extracts the identifier from slugs and identifier-only URLs", () => {
    expect(getIdFromSlug("hypertension-arterielle-42")).toBe("42");
    expect(getIdFromSlug("42")).toBe("42");
  });
});
