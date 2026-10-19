import { groupGeneNameToDCI } from "@/displayUtils";
import { getSlug } from "@/utils/slug";

/**
 * Builds the generic group page slug: slugified DCI part of the group name
 * followed by the group code, e.g. "cimetidine-200-mg-2" (see getSlug).
 */
export function getGenericSlug(codeGroupe: number | string, name: string): string {
  return getSlug(codeGroupe, groupGeneNameToDCI(name));
}
