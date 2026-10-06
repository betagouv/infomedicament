import { describe, expect, it } from "vitest";
import type { AnsmComposant, AnsmElement, AnsmSubstanceNom } from "@/db/types";
import { CompositionNature } from "@/types/SubstanceTypes";
import {
  compositionMatchesSubstanceSet,
  hasExactlyOneComponent,
  toCompositionComponents,
  splitDosageReference,
} from "./substanceCatalog";

const names: AnsmSubstanceNom[] = [
  {
    code_substance: "00005",
    code_nom: "00005",
    nom: "acétylsalicylique (acide)",
    type: "CANONIQUE",
  },
  {
    code_substance: "00005",
    code_nom: "34911",
    nom: "acide acétylsalicylique",
    type: "SYNONYME",
  },
  {
    code_substance: "63787",
    code_nom: "63787",
    nom: "estradiol",
    type: "CANONIQUE",
  },
];

const elements: AnsmElement[] = [
  { cis: "1", numero_element: 2, denomination: "second", ordre: 2 },
  { cis: "1", numero_element: 1, denomination: "first", ordre: 1 },
];

function component(overrides: Partial<AnsmComposant> = {}): AnsmComposant {
  return {
    cis: "1",
    numero_element: 1,
    numero_composant: 1,
    code_substance: "00005",
    substance: "acide acétylsalicylique",
    nature: "Substance active",
    dosage: "100 mg",
    ordre: 1,
    ...overrides,
  };
}

describe("substance catalog mapping", () => {
  it("separates dosage from its reference", () => {
    expect(splitDosageReference("20 mg pour une gélule")).toEqual({
      dosage: "20 mg",
      referenceDosage: "pour une gélule",
    });
    expect(splitDosageReference("100 mg")).toEqual({ dosage: "100 mg" });
  });

  it("preserves a synonym public id and explicit ordering", () => {
    const result = toCompositionComponents(
      [
        component({ numero_element: 2, numero_composant: 2, ordre: 2 }),
        component(),
      ],
      names,
      elements,
    );
    expect(result.map((row) => row.CompNum)).toEqual([1, 2]);
    expect(result[0]).toMatchObject({
      SubsId: "00005",
      NomId: "34911",
      NomLib: "acide acétylsalicylique",
      CompDosage: "100 mg",
      NatuId: CompositionNature.Substance,
    });
  });

  it("maps an active fraction with canonical fallback", () => {
    const [result] = toCompositionComponents(
      [
        component({
          code_substance: "63787",
          substance: "estradiol anhydre",
          nature: "Fraction active",
        }),
      ],
      names,
      elements,
    );
    expect(result).toMatchObject({
      SubsId: "63787",
      NomId: "63787",
      NomLib: "estradiol anhydre",
      NatuId: CompositionNature.Fraction,
    });
  });

  it("prefers canonical identity when a synonym duplicates its exact label", () => {
    const [result] = toCompositionComponents(
      [
        component({
          code_substance: "23185",
          substance: "tréprostinil sodique",
        }),
      ],
      [
        {
          code_substance: "23185",
          code_nom: "70587",
          nom: "tréprostinil sodique",
          type: "SYNONYME",
        },
        {
          code_substance: "23185",
          code_nom: "23185",
          nom: "tréprostinil sodique",
          type: "CANONIQUE",
        },
      ],
      elements,
    );
    expect(result.NomId).toBe("23185");
  });

  it("omits cell-source metadata from the displayed substance label", () => {
    const [result] = toCompositionComponents(
      [component({ code_substance: "65853", substance: "avélumab ((MAMMIFERE/HAMSTER/CELLULES CHO))" })],
      [{ code_substance: "65853", code_nom: "65853", nom: "avélumab", type: "CANONIQUE" }],
      elements,
    );
    expect(result).toMatchObject({
      SubsId: "65853",
      NomLib: "avélumab",
    });
  });
});

describe("legacy substance-set semantics", () => {
  it("treats a parent and active fraction as one component", () => {
    const rows = [
      component({ numero_composant: 1, ordre: 1, code_substance: "parent" }),
      component({ numero_composant: 10, ordre: 1, code_substance: "fraction", nature: "Fraction active" }),
    ];
    expect(compositionMatchesSubstanceSet(rows, ["fraction"])).toBe(true);
    expect(hasExactlyOneComponent(rows)).toBe(true);
  });

  it("is not a single component with several active fractions", () => {
    // N(2)-L-alanyl-L-glutamine and its active fractions alanine and glutamine
    const rows = [
      component({ numero_composant: 1, ordre: 1, code_substance: "dipeptide" }),
      component({ numero_composant: 3, ordre: 1, code_substance: "alanine", nature: "Fraction active" }),
      component({ numero_composant: 4, ordre: 1, code_substance: "glutamine", nature: "Fraction active" }),
    ];
    expect(hasExactlyOneComponent(rows)).toBe(false);
    // Matches only the displayed substances: all the active fractions
    expect(compositionMatchesSubstanceSet(rows, ["glutamine"])).toBe(false);
    expect(compositionMatchesSubstanceSet(rows, ["alanine"])).toBe(false);
    expect(compositionMatchesSubstanceSet(rows, ["dipeptide"])).toBe(false);
    expect(compositionMatchesSubstanceSet(rows, ["glutamine", "alanine"])).toBe(true);
  });

  it("matches the active fraction, not its active substance", () => {
    const rows = [
      component({ numero_composant: 1, ordre: 1, code_substance: "parent" }),
      component({ numero_composant: 10, ordre: 1, code_substance: "fraction", nature: "Fraction active" }),
    ];
    expect(compositionMatchesSubstanceSet(rows, ["fraction"])).toBe(true);
    expect(compositionMatchesSubstanceSet(rows, ["parent"])).toBe(false);
  });

  it("is not a single component with several active substances", () => {
    const rows = [
      component({ numero_composant: 1, ordre: 1, code_substance: "a" }),
      component({ numero_composant: 2, ordre: 1, code_substance: "b" }),
    ];
    expect(hasExactlyOneComponent(rows)).toBe(false);
  });

  it("requires the complete set across distinct components", () => {
    const rows = [
      component({ numero_composant: 1, code_substance: "a" }),
      component({ numero_composant: 2, ordre: 2, code_substance: "b" }),
    ];
    expect(compositionMatchesSubstanceSet(rows, ["a"])).toBe(false);
    expect(compositionMatchesSubstanceSet(rows, ["a", "b"])).toBe(true);
    expect(compositionMatchesSubstanceSet(rows, ["a", "a"])).toBe(false);
    expect(hasExactlyOneComponent(rows)).toBe(false);
  });

  it("keeps equal component orders in separate elements distinct", () => {
    const rows = [
      component({ numero_element: 1, code_substance: "a" }),
      component({ numero_element: 2, code_substance: "b" }),
    ];
    expect(hasExactlyOneComponent(rows)).toBe(false);
    expect(compositionMatchesSubstanceSet(rows, ["a", "b"])).toBe(true);
  });

  it("matches one substance repeated across distinct elements only when requested as many times", () => {
    const rows = [
      component({ numero_element: 1, code_substance: "a" }),
      component({ numero_element: 2, code_substance: "a" }),
    ];
    expect(hasExactlyOneComponent(rows)).toBe(false);
    expect(compositionMatchesSubstanceSet(rows, ["a"])).toBe(false);
    expect(compositionMatchesSubstanceSet(rows, ["a", "a"])).toBe(true);
    expect(compositionMatchesSubstanceSet(rows, ["a", "a", "a"])).toBe(false);
  });
});
