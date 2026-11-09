import { describe, it, expect } from "vitest";
import { cleanSubstanceName, getSubstanceMainName, getSubstancesNamesList, getSubstanceIdsFromSlug, getSubstanceSlug, getSubstancesPageNames, hasAllSubstances } from "./substances";

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
    const substances = [
      substance("48528", "20551", "losartan potassique", false),
      substance("64438", "64438", "losartan", false),
    ];
    const groups = [
      group("losartan", ["64438"], ["64438"]),
      group("losartan potassique", ["48528"], ["20551"]),
      group("losartan potassique", ["48528"], ["20551"]),
    ];

    expect(getSubstancesNamesList(substances, groups)).toEqual([
      { name: "losartan potassique", isCanonical: false, nbSpecsGroups: 2, details: [] },
      // Name of the active fraction, not canonical
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
    const substances = [
      substance("02202", "02202", "paracétamol", true),
      substance("00467", "00467", "codéine", false),
    ];
    const groups = [group("codéine, paracétamol", ["00467", "02202"], ["00467", "02202"])];

    expect(getSubstancesNamesList(substances, groups)).toEqual([{
      name: "codéine, paracétamol",
      isCanonical: false,
      nbSpecsGroups: 1,
      details: [{ subsId: "00467", name: "codéine" }, { subsId: "02202", name: "paracétamol" }],
    }]);
  });

  it("orders the substances of each name as the requested substances", () => {
    const substances = [
      substance("02202", "02202", "paracétamol", true),
      substance("74765", "74765", "codéine (phosphate de) hémihydraté", true),
      substance("74765", "89219", "phosphate de codéine hémihydraté", false),
    ];
    const main = group("paracétamol, codéine (phosphate de) hémihydraté", ["02202", "74765"], ["02202", "74765"]);
    const synonym = group("phosphate de codéine hémihydraté, paracétamol", ["74765", "02202"], ["89219", "02202"]);

    expect(getSubstancesNamesList(substances, [synonym, synonym, main], ["02202", "74765"]).map((names) => names.name)).toEqual([
      "paracétamol, phosphate de codéine hémihydraté",
      "paracétamol, codéine (phosphate de) hémihydraté",
    ]);
    expect(getSubstancesNamesList(substances, [synonym, main], ["74765", "02202"]).map((names) => names.name)).toEqual([
      "codéine (phosphate de) hémihydraté, paracétamol",
      "phosphate de codéine hémihydraté, paracétamol",
    ]);
  });

  it("orders a substance requested several times", () => {
    const substances = [substance("02202", "02202", "paracétamol", true), substance("02678", "02678", "diphénhydramine (chlorhydrate de)", true)];
    const groups = [group("", ["02202", "02678", "02202"], ["02202", "02678", "02202"])];

    expect(getSubstancesNamesList(substances, groups, ["02202", "02202", "02678"])[0].name)
      .toBe("paracétamol, paracétamol, diphénhydramine (chlorhydrate de)");
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
    expect(getSubstancesNamesList([substance("49632", "49632", "ranitidine base", true)], [])).toEqual([]);  });
});

describe("utils substances - slug", () => {
  it("builds a slug from a single substance", () => {
    expect(getSubstanceSlug([{ SubsId: "02202", NomLib: "paracétamol" }])).toBe(
      "paracetamol-02202",
    );
  });

  it("builds a slug from several substances, ids separated by commas", () => {
    expect(
      getSubstanceSlug([
        { SubsId: "02202", NomLib: "paracétamol" },
        { SubsId: "74765 ", NomLib: "codéine (phosphate de) hémihydraté" },
      ]),
    ).toBe("paracetamol-codeine-phosphate-de-hemihydrate-02202,74765");
  });

  it("builds a slug from the title of the page, followed by the ids", () => {
    expect(
      getSubstanceSlug(
        [
          { SubsId: "02202", NomLib: "paracétamol" },
          { SubsId: "74765", NomLib: "phosphate de codéine hémihydraté" },
        ],
        "paracétamol, codéine (phosphate de) hémihydraté",
      ),
    ).toBe("paracetamol-codeine-phosphate-de-hemihydrate-02202,74765");
  });

  it("builds a slug from the names without title", () => {
    expect(getSubstanceSlug([{ SubsId: "02202", NomLib: "acétaminophène" }], null)).toBe("acetaminophene-02202");
    expect(getSubstanceSlug([{ SubsId: "02202", NomLib: "acétaminophène" }], " ")).toBe("acetaminophene-02202");
  });

  it("keeps parentheses as word separators", () => {
    expect(getSubstanceSlug([{ SubsId: "00005", NomLib: "acétylsalicylique (acide)" }])).toBe(
      "acetylsalicylique-acide-00005",
    );
  });

  it("extracts ids from slugs, encoded slugs and id-only URLs", () => {
    expect(getSubstanceIdsFromSlug("paracetamol-02202")).toEqual(["02202"]);
    expect(getSubstanceIdsFromSlug("paracetamol-codeine-02202,74765")).toEqual(["02202", "74765"]);
    expect(getSubstanceIdsFromSlug("paracetamol-codeine-02202%2C74765")).toEqual(["02202", "74765"]);
    expect(getSubstanceIdsFromSlug("02202,74765")).toEqual(["02202", "74765"]);
  });
});

describe("utils/substance - hasAllSubstances", () => {
  const substances = [
    { SubsId: "02202", NomId: "02202", NomLib: "paracétamol", isCanonical: true },
    { SubsId: "74765", NomId: "89219", NomLib: "phosphate de codéine hémihydraté", isCanonical: false },
  ];

  it("checks that each requested substance has a name", () => {
    expect(hasAllSubstances(["02202", "74765"], substances)).toBe(true);
    expect(hasAllSubstances(["02202", "02202"], substances)).toBe(true);
    expect(hasAllSubstances(["02202", "00420"], substances)).toBe(false);
  });
});

describe("utils/substance - getSubstancesPageNames", () => {
  const group = (subsIds: string[], subsNamesIds: string[]) => ({ subsIds, subsNamesIds });
  const substance = (SubsId: string, NomId: string, NomLib: string, isCanonical: boolean) => ({ SubsId, NomId, NomLib, isCanonical });

  it("takes the canonical name displayed on the medicaments, even on fewer medicaments", () => {
    const substances = [
      substance("00628", "00628", "cétylpyridinium (chlorure de)", true),
      substance("00628", "71130", "chlorure de cétylpyridinium", false),
    ];
    const groups = [group(["00628"], ["71130"]), group(["00628"], ["71130"]), group(["00628"], ["00628"])];

    expect(getSubstancesPageNames(["00628"], substances, groups)).toEqual({
      title: "cétylpyridinium (chlorure de)",
      subtitle: "chlorure de cétylpyridinium",
      titleDetails: [],
    });
  });

  it("takes the name displayed on the most medicaments without canonical name displayed", () => {
    const substances = [
      substance("31844", "31844", "abacavir base", true),
      substance("31844", "65799", "abacavir", false),
      substance("31844", "12345", "abacavir anhydre", false),
    ];
    const groups = [group(["31844"], ["12345"]), group(["31844"], ["65799"]), group(["31844"], ["65799"])];

    expect(getSubstancesPageNames(["31844"], substances, groups)).toMatchObject({
      title: "abacavir",
      subtitle: "abacavir anhydre",
    });
  });

  it("orders the substances of the title as the requested substances", () => {
    const substances = [
      substance("02202", "02202", "paracétamol", true),
      substance("74765", "74765", "codéine (phosphate de) hémihydraté", true),
    ];
    const groups = [group(["74765", "02202"], ["74765", "02202"])];

    expect(getSubstancesPageNames(["02202", "74765"], substances, groups)).toEqual({
      title: "paracétamol, codéine (phosphate de) hémihydraté",
      subtitle: "",
      titleDetails: [
        { subsId: "02202", name: "paracétamol" },
        { subsId: "74765", name: "codéine (phosphate de) hémihydraté" },
      ],
    });
  });

  it("separates the other names of several substances with semicolons", () => {
    const substances = [
      substance("02202", "02202", "paracétamol", true),
      substance("74765", "74765", "codéine (phosphate de) hémihydraté", true),
      substance("74765", "89219", "phosphate de codéine hémihydraté", false),
      substance("74765", "90530", "codéine phosphate", false),
    ];
    const groups = [
      group(["02202", "74765"], ["02202", "74765"]),
      group(["02202", "74765"], ["02202", "89219"]),
      group(["02202", "74765"], ["02202", "90530"]),
    ];

    expect(getSubstancesPageNames(["02202", "74765"], substances, groups).subtitle)
      .toBe("paracétamol, codéine phosphate ; paracétamol, phosphate de codéine hémihydraté");
  });

  it("takes the main name of each substance without medicament", () => {
    const substances = [
      substance("02725", "02725", "(NE PAS UTILISER)- LEVOGLUTAMIDE", true),
      substance("02725", "72547", "glutamine", false),
      substance("49632", "49632", "ranitidine base", true),
    ];

    expect(getSubstancesPageNames(["49632", "02725"], substances, [])).toEqual({
      title: "ranitidine base, glutamine",
      subtitle: "",
      titleDetails: [],
    });
  });
});
