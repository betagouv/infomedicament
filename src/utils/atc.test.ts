import { describe, it, expect } from "vitest";
import { getAtcCodeFromSlug, getAtcSlug } from "./atc";

describe("utils atc - slug", () => {
  it("builds a slug from the ATC label and the lowercase code", () => {
    expect(getAtcSlug("A", "Système digestif et métabolisme")).toBe(
      "systeme-digestif-et-metabolisme-a",
    );
    expect(getAtcSlug("A02", "Médicaments de l'acidité")).toBe(
      "medicaments-de-l-acidite-a02",
    );
  });

  it("extracts the uppercase ATC code from slugs and code-only URLs", () => {
    expect(getAtcCodeFromSlug("medicaments-de-l-acidite-a02")).toBe("A02");
    expect(getAtcCodeFromSlug("A")).toBe("A");
  });
});
