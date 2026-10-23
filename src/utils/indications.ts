import { getSlug } from "@/utils/slug";

/**
 * Builds the indication page slug: slugified name followed by the indication id,
 * e.g. "hypertension-arterielle-42" (see getSlug).
 */
export function getIndicationSlug(id: number, name: string): string {
  return getSlug(id, name);
}
