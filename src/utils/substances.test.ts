import { describe, it, expect } from "vitest";
import { cleanSubstanceName, getSubstanceMainName, getSubstancesNamesList } from "./substances";

describe("utils/substance - cleanSubstanceName", () => {
  it("decodes named HTML entities", () => {
    expect(cleanSubstanceName("codant pour l&rsquo;arylsulfatase A")).toBe("codant pour l’arylsulfatase A");
    expect(cleanSubstanceName("&Delta;9-tétrahydrocannabinol")).toBe("Δ9-tétrahydrocannabinol");
  });

  it("decodes numeric HTML entities", () => {
    expect(cleanSubstanceName("l&#8217;acide")).toBe("l’acide");
    expect(cleanSubstanceName("l&#x2019;acide")).toBe("l’acide");
  });

  it("keeps unknown entities", () => {
    expect(cleanSubstanceName("a &unknown; b")).toBe("a &unknown; b");
  });

  it("removes double spaces", () => {
    expect(cleanSubstanceName("pixantrone  (dimaléate de)")).toBe("pixantrone (dimaléate de)");
    expect(cleanSubstanceName(" antigène  de surface ")).toBe("antigène de surface");
  });

  it("keeps a clean name unchanged", () => {
    expect(cleanSubstanceName("VALERIANE (RHIZOME DE) (POUDRE DE)")).toBe("VALERIANE (RHIZOME DE) (POUDRE DE)");
  });
});

describe("utils/substance - getSubstanceMainName", () => {
  it("takes the canonical name", () => {
    const substances = [
      { SubsId: "31844", NomId: "31844", NomLib: "abacavir base", isCanonical: true },
      { SubsId: "31844", NomId: "65799", NomLib: "abacavir", isCanonical: false },
    ];

    expect(getSubstanceMainName(substances)).toBe("abacavir base");
  });

  it("takes the first name without canonical name", () => {
    const substances = [{ SubsId: "48528", NomId: "20551", NomLib: "losartan potassique", isCanonical: false }];

    expect(getSubstanceMainName(substances)).toBe("losartan potassique");
    expect(getSubstanceMainName([])).toBe("");
  });

  it("does not take a deprecated name, even canonical", () => {
    const substances = [
      { SubsId: "02725", NomId: "02725", NomLib: "(NE PAS UTILISER)- LEVOGLUTAMIDE", isCanonical: true },
      { SubsId: "02725", NomId: "72547", NomLib: "glutamine", isCanonical: false },
    ];

    expect(getSubstanceMainName(substances)).toBe("glutamine");
  });

  it("takes a deprecated name when it is the only name", () => {
    const substances = [{ SubsId: "02725", NomId: "02725", NomLib: "(NE PAS UTILISER)- LEVOGLUTAMIDE", isCanonical: true }];

    expect(getSubstanceMainName(substances)).toBe("(NE PAS UTILISER)- LEVOGLUTAMIDE");
  });
});

describe("utils/substance - getSubstancesNamesList", () => {
  const group = (composants: string, subsIds: string[], subsNamesIds: string[]) => ({ composants, subsIds, subsNamesIds });
  const substance = (SubsId: string, NomId: string, NomLib: string, isCanonical: boolean) => ({ SubsId, NomId, NomLib, isCanonical });

  it("returns the names displayed on the medicaments", () => {
    // Losartan potassique (48528): its medicaments display "losartan potassique" or its active fraction "losartan"
    const substances = [substance("48528", "20551", "losartan potassique", false)];
    const groups = [
      group("losartan", ["64438"], ["64438"]),
      group("losartan potassique", ["48528"], ["20551"]),
      group("losartan potassique", ["48528"], ["20551"]),
    ];

    expect(getSubstancesNamesList(substances, groups)).toEqual([
      { name: "losartan potassique", isCanonical: false, nbSpecsGroups: 2, details: [] },
      // Name of the active fraction, not in substances: from the medicament label, not canonical
      { name: "losartan", isCanonical: false, nbSpecsGroups: 1, details: [] },
    ]);
  });

  it("uses the canonical type of the substances names", () => {
    const substances = [
      substance("31844", "31844", "abacavir base", true),
      substance("31844", "65799", "abacavir", false),
    ];
    const groups = [group("abacavir", ["31844"], ["65799"]), group("abacavir base", ["31844"], ["31844"])];

    expect(getSubstancesNamesList(substances, groups)).toEqual([
      { name: "abacavir", isCanonical: false, nbSpecsGroups: 1, details: [] },
      { name: "abacavir base", isCanonical: true, nbSpecsGroups: 1, details: [] },
    ]);
  });

  it("details the names of several substances, canonical only if each name is canonical", () => {
    const substances = [
      substance("02202", "02202", "paracétamol", true),
      substance("74765", "74765", "codéine (phosphate de) hémihydraté", true),
      substance("74765", "89219", "phosphate de codéine hémihydraté", false),
    ];
    const main = group("paracétamol, codéine (phosphate de) hémihydraté", ["02202", "74765"], ["02202", "74765"]);
    const synonym = group("phosphate de codéine hémihydraté, paracétamol", ["74765", "02202"], ["89219", "02202"]);

    expect(getSubstancesNamesList(substances, [synonym, synonym, main])).toEqual([
      {
        name: "phosphate de codéine hémihydraté, paracétamol",
        isCanonical: false,
        nbSpecsGroups: 2,
        details: [{ subsId: "74765", name: "phosphate de codéine hémihydraté" }, { subsId: "02202", name: "paracétamol" }],
      },
      {
        name: "paracétamol, codéine (phosphate de) hémihydraté",
        isCanonical: true,
        nbSpecsGroups: 1,
        details: [{ subsId: "02202", name: "paracétamol" }, { subsId: "74765", name: "codéine (phosphate de) hémihydraté" }],
      },
    ]);
  });

  it("groups the same names in a different order, with the most frequent order", () => {
    const substances = [substance("02202", "02202", "paracétamol", true), substance("00420", "00420", "caféine", true)];
    const groups = [
      group("caféine, paracétamol", ["00420", "02202"], ["00420", "02202"]),
      group("paracétamol, caféine", ["02202", "00420"], ["02202", "00420"]),
      group("paracétamol, caféine", ["02202", "00420"], ["02202", "00420"]),
    ];
    const namesList = getSubstancesNamesList(substances, groups);

    expect(namesList).toHaveLength(1);
    expect(namesList[0]).toMatchObject({ name: "paracétamol, caféine", nbSpecsGroups: 3 });
  });

  it("returns all the names of the medicaments, grouped by NomIds", () => {
    // "codéine" (00467) is displayed on a medicament of the paracétamol + codéine phosphate (74765) page
    const substances = [substance("02202", "02202", "paracétamol", true)];
    const groups = [group("codéine, paracétamol", ["00467", "02202"], ["00467", "02202"])];

    expect(getSubstancesNamesList(substances, groups)).toEqual([{
      name: "codéine, paracétamol",
      isCanonical: false,
      nbSpecsGroups: 1,
      details: [{ subsId: "00467", name: "codéine" }, { subsId: "02202", name: "paracétamol" }],
    }]);
  });

  it("keeps a substance displayed several times", () => {
    const substances = [substance("16736", "16736", "tolvaptan", true)];
    const groups = [group("tolvaptan, tolvaptan", ["16736", "16736"], ["16736", "16736"])];

    expect(getSubstancesNamesList(substances, groups)).toEqual([{
      name: "tolvaptan, tolvaptan",
      isCanonical: true,
      nbSpecsGroups: 1,
      details: [{ subsId: "16736", name: "tolvaptan" }, { subsId: "16736", name: "tolvaptan" }],
    }]);
  });

  it("returns no names without medicament", () => {
    expect(getSubstancesNamesList([substance("49632", "49632", "ranitidine base", true)], [])).toEqual([]);
  });
});
