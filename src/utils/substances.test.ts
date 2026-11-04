import { describe, it, expect } from "vitest";
import { getSubstanceIdsFromSlug, getSubstanceSlug } from "./substances";

describe("utils substances - slug", () => {
  it("builds a slug from a single substance", () => {
    expect(getSubstanceSlug([{ NomId: "02202", NomLib: "paracétamol" }])).toBe(
      "paracetamol-02202",
    );
  });

  it("builds a slug from several substances, ids separated by commas", () => {
    expect(
      getSubstanceSlug([
        { NomId: "02202", NomLib: "paracétamol" },
        { NomId: "01234 ", NomLib: "phosphate de codéine" },
      ]),
    ).toBe("paracetamol-phosphate-de-codeine-02202,01234");
  });

  it("keeps parentheses as word separators", () => {
    expect(getSubstanceSlug([{ NomId: "00005", NomLib: "acétylsalicylique (acide)" }])).toBe(
      "acetylsalicylique-acide-00005",
    );
  });

  it("extracts ids from slugs, encoded slugs and id-only URLs", () => {
    expect(getSubstanceIdsFromSlug("paracetamol-02202")).toEqual(["02202"]);
    expect(getSubstanceIdsFromSlug("paracetamol-codeine-02202,01234")).toEqual(["02202", "01234"]);
    expect(getSubstanceIdsFromSlug("paracetamol-codeine-02202%2C01234")).toEqual(["02202", "01234"]);
    expect(getSubstanceIdsFromSlug("02202,01234")).toEqual(["02202", "01234"]);
  });
});
