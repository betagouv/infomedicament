import type {
  AnsmComposant,
  AnsmElement,
  AnsmSubstanceNom,
} from "@/db/types";
import {
  CompositionNature,
  type CompositionComponent,
  type Substance,
} from "@/types/SubstanceTypes";

function normalizeName(value: string | null): string {
  return (value ?? "").trim().toLocaleLowerCase("fr-FR");
}

export function splitDosageReference(value: string): {
  dosage: string;
  referenceDosage?: string;
} {
  const match = value.trim().match(/^(.*?)\s+(pour\s+.+)$/i);
  if (!match) return { dosage: value.trim() };
  return { dosage: match[1].trim(), referenceDosage: match[2].trim() };
}

export function mapAnsmSubstance(row: AnsmSubstanceNom): Substance {
  return {
    SubsId: row.code_substance.trim(),
    NomId: row.code_nom.trim(),
    NomLib: row.nom?.trim() ?? "",
  };
}

function preferredName(
  component: AnsmComposant,
  names: AnsmSubstanceNom[],
): AnsmSubstanceNom | undefined {
  const exactNames = names.filter(
    (name) => normalizeName(name.nom) === normalizeName(component.substance),
  );
  return exactNames.find((name) => name.type === "CANONIQUE")
    ?? exactNames.sort((left, right) => left.code_nom.localeCompare(right.code_nom))[0]
    ?? names.find((name) => name.type === "CANONIQUE")
    ?? [...names].sort((left, right) => left.code_nom.localeCompare(right.code_nom))[0];
}

function componentKey(
  component: Pick<AnsmComposant, "numero_element" | "numero_composant" | "ordre">,
): string {
  return `${component.numero_element}:${component.ordre ?? component.numero_composant}`;
}

export function mapAnsmComposition(
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
  const elementOrder = new Map(elements.map((element) => [
    `${element.cis}:${element.numero_element}`,
    element.ordre ?? element.numero_element,
  ]));

  return rows.map((row) => {
    const code = row.code_substance?.trim() ?? "";
    const name = preferredName(row, namesByCode.get(code) ?? []);
    return {
      SpecId: row.cis,
      ElmtNum: row.numero_element,
      ElmtOrdre: elementOrder.get(`${row.cis}:${row.numero_element}`)
        ?? row.numero_element,
      NatuId: row.nature === "Fraction active"
        ? CompositionNature.Fraction
        : row.nature === "Substance active"
          ? CompositionNature.Substance
          : CompositionNature.Unknown,
      CompNum: row.ordre ?? row.numero_composant,
      CompOrdre: row.ordre ?? row.numero_composant,
      SubsId: code,
      NomId: name?.code_nom.trim() ?? code,
      NomLib: row.substance?.trim() || name?.nom?.trim() || "",
      CompDosage: row.dosage?.trim() ?? "",
      CompRem: "",
    };
  }).sort((left, right) =>
    left.ElmtOrdre - right.ElmtOrdre
    || left.ElmtNum - right.ElmtNum
    || left.CompOrdre - right.CompOrdre
    || left.CompNum - right.CompNum
    || left.NatuId.localeCompare(right.NatuId)
    || left.NomLib.localeCompare(right.NomLib, "fr"),
  );
}

export function hasCompleteSubstanceSet(
  components: Pick<
    AnsmComposant,
    "numero_element" | "numero_composant" | "ordre" | "code_substance"
  >[],
  substanceCodes: string[],
): boolean {
  const requestedCodes = [...new Set(substanceCodes)];
  if (requestedCodes.length === 0 || requestedCodes.length !== substanceCodes.length) {
    return false;
  }

  const requestedCodeSet = new Set(requestedCodes);
  const matchedCodes = new Set<string>();
  const codesByComponent = new Map<string, Set<string>>();
  for (const component of components) {
    const codes = codesByComponent.get(componentKey(component)) ?? new Set<string>();
    if (component.code_substance) codes.add(component.code_substance);
    codesByComponent.set(componentKey(component), codes);
  }

  for (const codes of codesByComponent.values()) {
    const requestedMatches = [...codes].filter((code) => requestedCodeSet.has(code));
    if (requestedMatches.length === 0) return false;
    requestedMatches.forEach((code) => matchedCodes.add(code));
  }
  return matchedCodes.size === requestedCodes.length;
}

export function hasExactlyOneComponent(
  components: Pick<AnsmComposant, "numero_element" | "numero_composant" | "ordre">[],
): boolean {
  return components.length > 0 && new Set(components.map(componentKey)).size === 1;
}
