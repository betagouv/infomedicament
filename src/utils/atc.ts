import { getIdFromSlug, getSlug } from "@/utils/slug";


export class ATCError extends Error {
  constructor(code: string) {
    super(`ATC code not found: ${code}`);
  }
}

//From ATC Code
export function getAtc1Code (atcCode:string): string {
  return atcCode.slice(0, 1);
}

//From ATC Code
export function getAtc2Code (atcCode:string): string {
  return atcCode.slice(0, 3);
}

/**
 * Builds the ATC class page slug: slugified label followed by the lowercase ATC code,
 * e.g. "systeme-digestif-et-metabolisme-a" (see getSlug).
 */
export function getAtcSlug(code: string, label: string): string {
  return getSlug(code.trim().toLowerCase(), label);
}

// ATC codes are uppercase in the database
export function getAtcCodeFromSlug(slug: string): string {
  return getIdFromSlug(slug).toUpperCase();
}
