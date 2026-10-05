import type { AnsmComposant, AnsmElement, AnsmSubstanceNom } from "@/db/types";
import {
  CompositionNature,
  type CompositionComponent,
  type Substance,
} from "@/types/SubstanceTypes";

function normalizeName(value: string | null): string {
  return (value ?? "").trim().toLocaleLowerCase("fr-FR");
}

function displayName(value: string): string {
  // ANSM component labels may append the cell source of a biological substance.
  // Keep it in the source data, but use the shorter substance label in the UI.
  return value.trim().replace(/\s+\(\([^()]+\)\)$/, "");
}

/**
 * Splits a dosage string into a base dosage and its explanatory reference,
 * for example "5 mg pour traitement de courte durée" becomes
 * { dosage: "5 mg", referenceDosage: "pour traitement de courte durée" }.
 */
export function splitDosageReference(value: string): {
  dosage: string;
  referenceDosage?: string;
} {
  const match = value.trim().match(/^(.*?)\s+(pour\s+.+)$/i);
  if (!match) return { dosage: value.trim() };
  return { dosage: match[1].trim(), referenceDosage: match[2].trim() };
}

/**
 * Maps a single ANSM substance name row into the app's shared Substance shape.
 * This is used when the code only needs the substance identifier and its label.
 */
export function toSubstance(row: AnsmSubstanceNom): Substance {
  return {
    SubsId: row.code_substance.trim(),
    NomId: row.code_nom.trim(),
    NomLib: row.nom?.trim() ?? "",
    isCanonical: row.type === "CANONIQUE",
  };
}

function preferredName(
  component: AnsmComposant,
  names: AnsmSubstanceNom[],
): AnsmSubstanceNom | undefined {
  const exactNames = names.filter(
    (name) => normalizeName(name.nom) === normalizeName(component.substance),
  );
  return (
    exactNames.find((name) => name.type === "CANONIQUE") ??
    exactNames.sort((left, right) =>
      left.code_nom.localeCompare(right.code_nom),
    )[0] ??
    names.find((name) => name.type === "CANONIQUE") ??
    [...names].sort((left, right) =>
      left.code_nom.localeCompare(right.code_nom),
    )[0]
  );
}

function componentKey(
  component: Pick<
    AnsmComposant,
    "numero_element" | "numero_composant" | "ordre"
  >,
): string {
  return `${component.numero_element}:${component.ordre ?? component.numero_composant}`;
}

/**
 * Builds the normalized composition entries used by the app from ANSM component rows,
 * preferred substance names, and element metadata.
 *
 * The returned objects are sorted in a display-safe order by element and component
 * position, while resolving the preferred label and substance identifier for each row.
 */
export function toCompositionComponents(
  rows: AnsmComposant[],
  names: AnsmSubstanceNom[],
  elements: AnsmElement[],
): CompositionComponent[] {
  const namesByCode = new Map<string, AnsmSubstanceNom[]>();
  for (const name of names) {
    const values = namesByCode.get(name.code_substance) ?? [];
    values.push(name);
    namesByCode.set(name.code_substance, values);
  }
  const elementOrder = new Map(
    elements.map((element) => [
      `${element.cis}:${element.numero_element}`,
      element.ordre ?? element.numero_element,
    ]),
  );

  return rows
    .map((row) => {
      const code = row.code_substance?.trim() ?? "";
      const name = preferredName(row, namesByCode.get(code) ?? []);
      return {
        SpecId: row.cis,
        ElmtNum: row.numero_element,
        ElmtOrdre:
          elementOrder.get(`${row.cis}:${row.numero_element}`) ??
          row.numero_element,
        NatuId:
          row.nature === "Fraction active"
            ? CompositionNature.Fraction
            : row.nature === "Substance active"
              ? CompositionNature.Substance
              : CompositionNature.Unknown,
        CompNum: row.ordre ?? row.numero_composant,
        CompOrdre: row.ordre ?? row.numero_composant,
        SubsId: code,
        NomId: name?.code_nom.trim() ?? code,
        NomLib: displayName(row.substance || name?.nom || ""),
        isCanonical: name?.type === "CANONIQUE",
        CompDosage: row.dosage?.trim() ?? "",
        CompRem: "",
      };
    })
    .sort(
      (left, right) =>
        left.ElmtOrdre - right.ElmtOrdre ||
        left.ElmtNum - right.ElmtNum ||
        left.CompOrdre - right.CompOrdre ||
        left.CompNum - right.CompNum ||
        left.NomLib.localeCompare(right.NomLib, "fr"),
    );
}

/**
 * Verifies that the composition's components are exactly the requested substance codes:
 * each component matches one requested code, and a code requested twice needs two components
 * (e.g. a kit of two tablets of the same substance).
 */
export function compositionMatchesSubstanceSet(
  components: Pick<
    AnsmComposant,
    "numero_element" | "numero_composant" | "ordre" | "code_substance"
  >[],
  substanceCodes: string[],
): boolean {
  if (substanceCodes.length === 0) return false;

  const codesByComponent = new Map<string, Set<string>>();
  for (const component of components) {
    const codes =
      codesByComponent.get(componentKey(component)) ?? new Set<string>();
    if (component.code_substance) codes.add(component.code_substance);
    codesByComponent.set(componentKey(component), codes);
  }
  if (codesByComponent.size !== substanceCodes.length) return false;

  const remainingCodes = [...substanceCodes];
  for (const codes of codesByComponent.values()) {
    const index = remainingCodes.findIndex((code) => codes.has(code));
    if (index === -1) return false;
    remainingCodes.splice(index, 1);
  }
  return remainingCodes.length === 0;
}

export function hasExactlyOneComponent(
  components: Pick<
    AnsmComposant,
    "numero_element" | "numero_composant" | "ordre"
  >[],
): boolean {
  return (
    components.length > 0 && new Set(components.map(componentKey)).size === 1
  );
}
