import { Substance, SubstancesName } from "@/types/SubstanceTypes";
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

// Names details of one or several substances
// If multiple substances, the name of each substance are in the same row
// Only names used in specsGroups
// isCanonical: each name is canonical
// Ordered by the number of medicaments
export function getSubstancesNamesList(
  substances: Substance[],
  specsGroups: Pick<ResumeSpecGroup, "subsIds" | "subsNamesIds">[],
): SubstancesName[] {
  // Names grouped by NomIds (same NomIds in a different order are the same),
  // with the number of medicaments for each order of the NomIds
  const namesByNomIds = new Map<string, {
    nbSpecsGroups: number,
    orders: Map<string, { nb: number, groupSubsIds: string[], groupNomIds: string[] }>,
  }>();

  specsGroups.forEach((group) => {
    const groupSubsIds = group.subsIds.map((subsId) => subsId.trim());
    const groupNomIds = group.subsNamesIds.map((nomId) => nomId.trim());
    if (groupNomIds.length === 0) return;

    const nomIdsKey = [...groupNomIds].sort().join(",");
    const current = namesByNomIds.get(nomIdsKey) ?? { nbSpecsGroups: 0, orders: new Map() };
    current.nbSpecsGroups += 1;
    const orderKey = groupNomIds.join(",");
    const order = current.orders.get(orderKey) ?? { nb: 0, groupSubsIds, groupNomIds };
    order.nb += 1;
    current.orders.set(orderKey, order);
    namesByNomIds.set(nomIdsKey, current);
  });

  // Name of each NomId, from the substances names
  const getSubstance = (nomId: string) => substances.find((subs) => subs.NomId.trim() === nomId);

  return [...namesByNomIds.values()]
    .map(({ nbSpecsGroups, orders }) => {
      // The most frequent order of the NomIds
      const [, { groupSubsIds, groupNomIds }] = [...orders.entries()]
        .sort(([orderA, a], [orderB, b]) => b.nb - a.nb || orderA.localeCompare(orderB))[0];
      const details = groupNomIds.map((nomId, index) => ({
        subsId: groupSubsIds[index],
        name: cleanSubstanceName(getSubstance(nomId)?.NomLib ?? ""),
      }));
      return {
        name: details.map((detail) => detail.name).join(", "),
        isCanonical: groupNomIds.every((nomId) => getSubstance(nomId)?.isCanonical ?? false),
        nbSpecsGroups,
        details: details.length > 1 ? details : [],
      };
    })
    .sort((a, b) => b.nbSpecsGroups - a.nbSpecsGroups || a.name.localeCompare(b.name, "fr"));
}
