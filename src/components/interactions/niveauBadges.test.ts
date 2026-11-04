import { describe, it, expect } from "vitest";
import { getNiveauBadges, CODE_COLORS } from "./niveauBadges";

describe("getNiveauBadges", () => {
  it("returns one badge for a single known code", () => {
    const badges = getNiveauBadges("ci");
    expect(badges).toHaveLength(1);
    expect(badges[0].label).toBe("Contre-indication");
    expect(badges[0].color).toBe(CODE_COLORS.ci);
  });

  it("returns white text for dark-background codes (ci, asdec)", () => {
    expect(getNiveauBadges("ci")[0].textColor).toBe("#fff");
    expect(getNiveauBadges("asdec")[0].textColor).toBe("#fff");
  });

  it("returns dark text for light-background codes (pe, apec, neg, texte)", () => {
    for (const code of ["pe", "apec", "neg", "texte"]) {
      expect(getNiveauBadges(code)[0].textColor).toBe("#1e1e1e");
    }
  });

  it("returns two badges for two distinct codes", () => {
    const badges = getNiveauBadges("ci/pe");
    expect(badges).toHaveLength(2);
    expect(badges[0].label).toBe("Contre-indication");
    expect(badges[1].label).toBe("Précaution d'emploi");
  });

  it("deduplicates codes that map to the same label (asdec/dcn/dnc)", () => {
    // All three map to "Association déconseillée"
    expect(getNiveauBadges("asdec/dcn")).toHaveLength(1);
    expect(getNiveauBadges("dcn/dnc")).toHaveLength(1);
    expect(getNiveauBadges("asdec/dcn/dnc")).toHaveLength(1);
    expect(getNiveauBadges("asdec/dcn")[0].label).toBe("Association déconseillée");
  });

  it("falls back to the raw code as label for unknown codes", () => {
    const badges = getNiveauBadges("xyz");
    expect(badges[0].label).toBe("xyz");
  });

  it("falls back to grey color for unknown codes", () => {
    expect(getNiveauBadges("xyz")[0].color).toBe("#9e9e9e");
  });

  it("falls back to white text for unknown codes (not in LIGHT_CODES)", () => {
    expect(getNiveauBadges("xyz")[0].textColor).toBe("#fff");
  });

  it("handles a known code mixed with an unknown code", () => {
    const badges = getNiveauBadges("ci/xyz");
    expect(badges).toHaveLength(2);
    expect(badges[0].label).toBe("Contre-indication");
    expect(badges[1].label).toBe("xyz");
  });
});
