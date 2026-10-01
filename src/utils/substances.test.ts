import { describe, it, expect } from "vitest";
import { cleanSubstanceName, getSubstancePageNames, getSubstanceMainName } from "./substances";

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

describe("utils/substance - getSubstancePageNames", () => {
  // Escitalopram oxalate (78924): its medicaments display the active fraction escitalopram (89971)
  const escitalopram = { composants: "escitalopram", subsIds: ["89971"], subsNamesIds: ["89971"] };
  const escitalopramOxalate = { composants: "oxalate d'escitalopram", subsIds: ["78924"], subsNamesIds: ["20260"] };
  const escitalopramOxalateMain = { composants: "escitalopram (oxalate d')", subsIds: ["78924"], subsNamesIds: ["78924"] };

  it("takes the names displayed on the medicaments groups", () => {
    const names = getSubstancePageNames(["78924"], [escitalopram, escitalopram]);

    expect(names.title).toBe("escitalopram");
    expect(names.secondaryNames).toEqual([]);
  });

  it("takes the canonical names of the page substances when displayed, even on fewer medicaments", () => {
    const names = getSubstancePageNames(["78924"], [escitalopramOxalate, escitalopramOxalate, escitalopramOxalateMain]);

    expect(names.title).toBe("escitalopram (oxalate d')");
    expect(names.secondaryNames).toEqual(["oxalate d'escitalopram"]);
  });

  it("does not give priority to the canonical name of another substance", () => {
    // Losartan potassique (48528): 12 medicaments display "losartan potassique",
    // 4 display its active fraction "losartan" (64438) under its canonical name
    const losartanPotassique = { composants: "losartan potassique", subsIds: ["48528"], subsNamesIds: ["20551"] };
    const losartan = { composants: "losartan", subsIds: ["64438"], subsNamesIds: ["64438"] };
    const names = getSubstancePageNames(["48528"], [losartan, losartanPotassique, losartanPotassique]);

    expect(names.title).toBe("losartan potassique");
    expect(names.secondaryNames).toEqual(["losartan"]);
  });

  it("takes the names displayed on the most medicaments when no canonical name is displayed", () => {
    // Monoxyde d'azote (48940): its canonical name is not used by the specialites
    const monoxydeAzote = { composants: "monoxyde d'azote", subsIds: ["48940"], subsNamesIds: ["82993"] };
    const azoteMonoxyde = { composants: "azote (monoxyde d')", subsIds: ["48940"], subsNamesIds: ["90002"] };
    const names = getSubstancePageNames(["48940"], [azoteMonoxyde, monoxydeAzote, monoxydeAzote]);

    expect(names.title).toBe("monoxyde d'azote");
    expect(names.secondaryNames).toEqual(["azote (monoxyde d')"]);
  });

  it("uses all the substances names of a combination", () => {
    const main = { composants: "paracétamol, codéine", subsIds: ["02202", "74765"], subsNamesIds: ["02202", "74765"] };
    const synonym = { composants: "paracétamol, phosphate de codéine hémihydraté", subsIds: ["02202", "74765"], subsNamesIds: ["02202", "89219"] };
    const names = getSubstancePageNames(["02202", "74765"], [synonym, synonym, main]);

    expect(names.title).toBe("paracétamol, codéine");
    expect(names.secondaryNames).toEqual(["paracétamol, phosphate de codéine hémihydraté"]);
  });

  it("groups the same names in a different order", () => {
    const paracetamolCodeine = { composants: "paracétamol, codéine", subsIds: ["02202", "74765"], subsNamesIds: ["02202", "74765"] };
    const codeineParacetamol = { composants: "codéine, paracétamol", subsIds: ["74765", "02202"], subsNamesIds: ["74765", "02202"] };
    const names = getSubstancePageNames(["02202", "74765"], [codeineParacetamol, paracetamolCodeine, paracetamolCodeine]);

    expect(names.title).toBe("paracétamol, codéine");
    expect(names.secondaryNames).toEqual([]);
  });

  it("cleans the names", () => {
    const pixantrone = { composants: "pixantrone  (dimaléate de)", subsIds: ["15285"], subsNamesIds: ["15285"] };

    expect(getSubstancePageNames(["15285"], [pixantrone]).title).toBe("pixantrone (dimaléate de)");
  });

  it("returns an empty title without medicament", () => {
    expect(getSubstancePageNames(["15285"], [])).toEqual({ title: "", secondaryNames: [] });
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
});
