import { describe, it, expect } from "vitest";
import { getIdFromSlug, getNumericIdFromSlug, getSlug } from "./slug";

describe("slug", () => {
  it("builds a slug from the name and the identifier", () => {
    expect(getSlug(60234100, "DOLIPRANE 1000 mg, comprimé")).toBe(
      "doliprane-1000-mg-comprime-60234100",
    );
  });

  it("replaces apostrophes with dashes", () => {
    expect(getSlug(1, "Troubles de l'acidité")).toBe("troubles-de-l-acidite-1");
    expect(getSlug(2, "Médicaments contre l’acné")).toBe("medicaments-contre-l-acne-2");
  });

  it("falls back to the identifier when the name is empty", () => {
    expect(getSlug(42, "")).toBe("42");
  });

  it("extracts the identifier from slugs and identifier-only URLs", () => {
    expect(getIdFromSlug("hypertension-arterielle-42")).toBe("42");
    expect(getIdFromSlug("42")).toBe("42");
  });

  it("extracts numeric identifiers and rejects invalid ones", () => {
    expect(getNumericIdFromSlug("hypertension-arterielle-42")).toBe(42);
    expect(getNumericIdFromSlug("42")).toBe(42);
    expect(getNumericIdFromSlug("foo-abc")).toBeUndefined();
    expect(getNumericIdFromSlug("foo-")).toBeUndefined();
    expect(getNumericIdFromSlug("foo-0")).toBeUndefined();
    expect(getNumericIdFromSlug("foo-12.5")).toBeUndefined();
  });
});
