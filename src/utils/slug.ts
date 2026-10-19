import slugify from "slugify";

/**
 * Builds a page slug: slugified name followed by the identifier,
 * e.g. "doliprane-1000-mg-comprime-60234100".
 * The identifier suffix keeps slugs unique and stable when a name changes.
 */
export function getSlug(id: string | number, name: string): string {
  // Keep as word separators:
  // - "/" between dosages and substances (e.g. "500 mg/25 mg")
  // - parentheses, sometimes not preceded by a space (e.g. "injectable(vaccin")
  // - apostrophes (e.g. "l'acidité" -> "l-acidite", not "lacidite")
  // - periods (e.g. "0.5 mg", "XBB.1.5", "injectable.Vaccin", "L.P." -> "l-p")
  // - the decimal comma (e.g. "11,25 mg" -> "11-25-mg", not "1125-mg")
  const separatedName = name
    .replace(/[/()'’.]/g, "-")
    .replace(/(\d),(\d)/g, "$1-$2");
  const nameSlug = slugify(separatedName, { lower: true, strict: true, locale: "fr" });
  const trimmedId = id.toString().trim();
  return nameSlug ? `${nameSlug}-${trimmedId}` : trimmedId;
}

/**
 * Extracts the identifier from a slug (its last part).
 * Also accepts URLs that only contain the identifier.
 */
export function getIdFromSlug(slug: string): string {
  return decodeURIComponent(slug).split("-").pop()?.trim() ?? "";
}

/**
 * Extracts a numeric identifier from a slug.
 * Returns undefined when the identifier is not a positive integer
 * (e.g. a malformed URL typed by hand).
 */
export function getNumericIdFromSlug(slug: string): number | undefined {
  const id = Number(getIdFromSlug(slug));
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}
