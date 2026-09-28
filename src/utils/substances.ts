import { Substance } from "@/types/SubstanceTypes";

export function getSubstanceMainName(
  substances: Substance[],
): string {
  if(substances.length === 0) return "";
  const subsId = substances[0].SubsId;
  //The main name is the one where SubsId = NomId
  const subs = substances.find((subs) => subs.NomId === subsId);
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
