import { Substance } from "@/types/SubstanceTypes";
import { ResumeSpecGroup } from "@/types/SpecialiteTypes";

export function getSubstanceMainName(
  substances: Substance[],
): string {
  if(substances.length === 0) return "";
  const subs = substances.find((subs) => subs.isCanonical);
  if(subs) return subs.NomLib.trim();
  else return substances[0].NomLib.trim();
}

const HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  quot: "\"",
  lt: "<",
  gt: ">",
  nbsp: " ",
  lsquo: "‘",
  rsquo: "’",
  Delta: "Δ",
};

// Decodes the HTML entities and removes the extra spaces of a substance name
export function cleanSubstanceName(name: string): string {
  return name
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (entity, key) => HTML_ENTITIES[key] ?? entity)
    .replace(/\s+/g, " ")
    .trim();
}

// Names displayed on a substance page, only names from medicaments groups:
// title : 1. the canonical names (NomId = SubsId), 2. the names displayed on the most medicaments
// subtile : the other names 
export function getSubstancePageNames(
  subsIds: string[],
  specsGroups: Pick<ResumeSpecGroup, "composants" | "subsIds" | "subsNamesIds">[],
): { title: string, secondaryNames: string[] } {
  const pageSubsIds = subsIds.map((subsId) => subsId.trim()).sort().join(",");
  // Same names in a different order are the same names: group them by their NomIds
  const namesMap = new Map<string, { nbMedicaments: number, isMainName: boolean, labels: Map<string, number> }>();
  specsGroups.forEach((group) => {
    const key = group.subsNamesIds.map((nomId) => nomId.trim()).sort().join(",");
    const label = cleanSubstanceName(group.composants);
    // Main names of the page substances
    const isPageSubstances = group.subsIds.map((subsId) => subsId.trim()).sort().join(",") === pageSubsIds;
    const isMainName = isPageSubstances
      && group.subsNamesIds.every((nomId, index) => nomId.trim() === group.subsIds[index]?.trim());
    const current = namesMap.get(key) ?? { nbMedicaments: 0, isMainName: false, labels: new Map<string, number>() };
    current.nbMedicaments += 1;
    current.isMainName = current.isMainName || isMainName;
    current.labels.set(label, (current.labels.get(label) ?? 0) + 1);
    namesMap.set(key, current);
  });

  // For each names, display the most frequent order
  const sortedNames = [...namesMap.values()]
    .map((names) => ({
      ...names,
      label: [...names.labels.entries()].sort(([labelA, a], [labelB, b]) => b - a || labelA.localeCompare(labelB, "fr"))[0][0],
    }))
    .sort((a, b) => b.nbMedicaments - a.nbMedicaments || a.label.localeCompare(b.label, "fr"));
  if (sortedNames.length === 0) return { title: "", secondaryNames: [] };

  const title = (sortedNames.find((names) => names.isMainName) ?? sortedNames[0]).label;
  return {
    title,
    secondaryNames: sortedNames.map((names) => names.label).filter((label) => label !== title),
  };
}
