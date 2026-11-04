import { getIdFromSlug, getSlug } from "@/utils/slug";
import type { Substance } from "@/types/SubstanceTypes";

/**
 * Builds the substance page slug: slugified substance names followed by
 * their comma-separated ids, e.g. "paracetamol-codeine-02202,01234" (see getSlug).
 */
export function getSubstanceSlug(
  substances: Pick<Substance, "NomId" | "NomLib">[],
): string {
  return getSlug(
    substances.map((s) => s.NomId.trim()).join(","),
    substances.map((s) => s.NomLib.trim()).join(" "),
  );
}

/** Extracts the substance ids (NomId) from a substance page slug. */
export function getSubstanceIdsFromSlug(slug: string): string[] {
  return getIdFromSlug(slug)
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}
