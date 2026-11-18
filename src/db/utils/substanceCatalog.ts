import type { AnsmComposant, AnsmElement, AnsmSubstanceNom } from "@/db/types";
import {
  CompositionNature,
  type CompositionComponent,
  type Substance,
} from "@/types/SubstanceTypes";

function normalizeName(value: string | null): string {
  return (value ?? "").trim().toLocaleLowerCase("fr-FR");
}

export function displayName(value: string): string {
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
 * Verifies that the substances displayed for the composition are exactly the requested substance codes:
 * for each component, its active fractions if any, otherwise its active substances
 * (same as the substances displayed on the medicament page, see displaySimpleComposants).
 * A code requested twice needs to be displayed twice (e.g. a kit of two tablets of the same substance).
 */
export function compositionMatchesSubstanceSet(
  components: Pick<
    AnsmComposant,
    "numero_element" | "numero_composant" | "ordre" | "code_substance" | "nature"
  >[],
  substanceCodes: string[],
): boolean {
  if (substanceCodes.length === 0) return false;

  const rowsByComponent = new Map<string, typeof components>();
  for (const component of components) {
    const key = componentKey(component);
    rowsByComponent.set(key, [...(rowsByComponent.get(key) ?? []), component]);
  }
  const displayedCodes = [...rowsByComponent.values()].flatMap((rows) => {
    const fractions = rows.filter((row) => row.nature === "Fraction active");
    const displayed = fractions.length > 0 ? fractions : rows;
    return [...new Set(displayed.flatMap((row) => row.code_substance ? [row.code_substance.trim()] : []))];
  });

  const sortedCodes = (codes: string[]) => [...codes].sort().join(",");
  return sortedCodes(displayedCodes) === sortedCodes(substanceCodes.map((code) => code.trim()));
}

/**
 * A single component, with a single active substance and at most a single active fraction
 * (e.g. not N(2)-L-alanyl-L-glutamine and its two active fractions alanine and glutamine).
 */
export function hasExactlyOneComponent(
  components: Pick<
    AnsmComposant,
    "numero_element" | "numero_composant" | "ordre" | "code_substance" | "nature"
  >[],
): boolean {
  const codes = (nature: AnsmComposant["nature"]) =>
    new Set(
      components
        .filter((component) => component.nature === nature)
        .map((component) => component.code_substance?.trim()),
    );
  const substances = codes("Substance active");
  const fractions = codes("Fraction active");
  return (
    components.length > 0 &&
    new Set(components.map(componentKey)).size === 1 &&
    (substances.size === 0 || substances.size === 1) &&
    (fractions.size === 0 || fractions.size === 1)
  );
}
