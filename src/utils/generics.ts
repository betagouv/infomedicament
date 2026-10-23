import { GenericGroup } from "@/db/utils/generics";
import { formatFrenchList, formatSpecName, groupGeneNameToDCI } from "@/displayUtils";
import { getSlug } from "@/utils/slug";

/**
 * Builds the generic group page slug: slugified DCI part of the group name
 * followed by the group code, e.g. "cimetidine-200-mg-2" (see getSlug).
 */
export function getGenericSlug(codeGroupe: number | string, name: string): string {
  return getSlug(codeGroupe, groupGeneNameToDCI(name));
}

/**
 * Builds the meta description of a generic group page: its princeps and the number
 * of its equivalent generic medicines, e.g. "Le princeps de ce groupe générique
 * est Celebrex 200 mg, gélule, et il comprend 11 spécialités génériques équivalentes."
 */
export function getGenericGroupDescription(group: GenericGroup): string {
  const { princeps, generiques } = group;

  const princepsNames = formatFrenchList(princeps.map((p) => formatSpecName(p.SpecDenom01.trim())));

  const princepsPart =
    princeps.length > 1
      ? `Les princeps de ce groupe générique sont ${princepsNames}, et il`
      : princeps.length === 1
        ? `Le princeps de ce groupe générique est ${princepsNames}, et il`
        : "Ce groupe générique";

  const generiquesPart =
    generiques.length > 1
      ? `comprend ${generiques.length} spécialités génériques équivalentes.`
      : generiques.length === 1
        ? "comprend 1 spécialité générique équivalente."
        : "ne comprend pas de spécialité générique équivalente.";

  return `${princepsPart} ${generiquesPart}`;
}
