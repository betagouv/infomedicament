import { Substance, SubstancesName } from "@/types/SubstanceTypes";
import { ResumeSpecGroup } from "@/types/SpecialiteTypes";
import { getIdFromSlug, getSlug } from "@/utils/slug";

// ANSM names that must not be used, e.g. "(NE PAS UTILISER)- LEVOGLUTAMIDE"
const isDeprecatedName = (subs: Substance): boolean => subs.NomLib.trim().startsWith("(NE PAS UTILISER)");

export function getSubstanceMainName(
  substances: Substance[],
): string {
  if(substances.length === 0) return "";
  // Without the deprecated names, unless they are the only names
  const names = substances.some((subs) => !isDeprecatedName(subs))
    ? substances.filter((subs) => !isDeprecatedName(subs))
    : substances;
  const subs = names.find((subs) => subs.isCanonical);
  if(subs) return subs.NomLib.trim();
  else return names[0].NomLib.trim();
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

// Sorts the names details in the order of the substances ids (a substance requested twice takes two positions),
// the substances not in the ids at the end
function sortBySubsIds<T extends { subsId: string }>(details: T[], subsIds: string[]): T[] {
  const pageSubsIds = subsIds.map((subsId) => subsId.trim());
  const usedPositions = new Set<number>();
  return details
    .map((detail) => {
      const position = pageSubsIds.findIndex((subsId, index) => subsId === detail.subsId && !usedPositions.has(index));
      if (position !== -1) usedPositions.add(position);
      return { detail, position: position === -1 ? pageSubsIds.length : position };
    })
    .sort((a, b) => a.position - b.position)
    .map(({ detail }) => detail);
}

// Names details of one or several substances
// If multiple substances, the name of each substance are in the same row
// Only names used in specsGroups
// isCanonical: each name is canonical
// Ordered by the number of medicaments
// subsIds: order of the substances in each name (e.g. the page substances), otherwise the most frequent order
export function getSubstancesNamesList(
  substances: Substance[],
  specsGroups: Pick<ResumeSpecGroup, "subsIds" | "subsNamesIds">[],
  subsIds: string[] = [],
): SubstancesName[] {
  // Names grouped by NomIds (same NomIds in a different order are the same),
  // with the number of medicaments for each order of the NomIds
  const namesByNomIds = new Map<string, {
    nbSpecsGroups: number,
    orders: Map<string, { nb: number, groupSubsIds: string[], groupNomIds: string[] }>,
  }>();

  specsGroups.forEach((group) => {
    // Empty until the resume data is updated after the migration
    const groupSubsIds = (group.subsIds ?? []).map((subsId) => subsId.trim());
    const groupNomIds = (group.subsNamesIds ?? []).map((nomId) => nomId.trim());
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
      const details = sortBySubsIds(
        groupNomIds.map((nomId, index) => ({
          subsId: groupSubsIds[index],
          name: cleanSubstanceName(getSubstance(nomId)?.NomLib ?? ""),
        })),
        subsIds,
      );
      return {
        name: details.map((detail) => detail.name).join(", "),
        isCanonical: groupNomIds.every((nomId) => getSubstance(nomId)?.isCanonical ?? false),
        nbSpecsGroups,
        details: details.length > 1 ? details : [],
      };
    })
    .sort((a, b) => b.nbSpecsGroups - a.nbSpecsGroups || a.name.localeCompare(b.name, "fr"));
}

/**
 * Builds the substance page slug: slugified title of the page (the substance names without title)
 * followed by their comma-separated SubsIds, e.g. paracétamol (02202) and codéine (phosphate de) hémihydraté (74765):
 * "paracetamol-codeine-phosphate-de-hemihydrate-02202,74765" (see getSlug).
 * With the title, this is the canonical URL of the page.
 */
export function getSubstanceSlug(
  substances: Pick<Substance, "SubsId" | "NomLib">[],
  title?: string | null,
): string {
  return getSlug(
    substances.map((s) => s.SubsId.trim()).join(","),
    title?.trim() || substances.map((s) => s.NomLib.trim()).join(" "),
  );
}

/** Extracts the substance ids (SubsId) from a substance page slug. */
export function getSubstanceIdsFromSlug(slug: string): string[] {
  return getIdFromSlug(slug)
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

// Check if all the requested substances are loaded
// Usefull when the page are for multiple substances and some of them are the same
export const hasAllSubstances = (subsIds: string[], substances: Substance[]): boolean =>
  subsIds.every((subsId) => substances.some((subs) => subs.SubsId.trim() === subsId));

// Title and subtitle of the substances page: only the substances names from specsGroups
export const getSubstancesPageNames = (
  subsIds: string[],
  substances: Substance[],
  specsGroups: Pick<ResumeSpecGroup, "subsIds" | "subsNamesIds">[],
): { title: string, subtitle: string, titleDetails: SubstancesName["details"] } => {
  // Title: the canonical names if displayed on the medicaments, otherwise the names displayed on the most medicaments
  // Title and subtitle: the substances in the order of the page ids
  const namesList = getSubstancesNamesList(substances, specsGroups, subsIds);
  const titleNames = namesList.find((names) => names.isCanonical) ?? namesList[0];
  if (titleNames) {
    // Subtitle: the other names
    const secondaryNames = namesList
      .filter((names) => names !== titleNames)
      .map((names) => names.name);
    return {
      title: titleNames.name,
      subtitle: secondaryNames.join(subsIds.length > 1 ? " ; " : ", "),
      titleDetails: titleNames.details,
    };
  }
  // No medicament: main name of each substance
  return {
    title: subsIds.map((subsId) => getSubstanceMainName(substances.filter((subs) => subs.SubsId.trim() === subsId))).join(", "),
    subtitle: "",
    titleDetails: [],
  };
};
