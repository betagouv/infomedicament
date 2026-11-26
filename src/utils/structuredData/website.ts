import {
  getPublisher,
  getWebSiteId,
  SITE_DOMAIN,
  SITE_NAME,
  SITE_SECTIONS,
  SPATIAL_COVERAGE,
  StructuredData,
} from "./index";

// Description of the site (meta description of the homepage)
export const SITE_DESCRIPTION =
  "Accédez aux informations officielles sur les médicaments : notices, RCP, interactions médicamenteuses et ressources pour les professionnels de santé.";

// Search page and its query parameter (see AutocompleteSearch inputName)
const SEARCH_PATH = "/rechercher";
const SEARCH_PARAM = "s";

/**
 * Site, on the homepage: https://schema.org/WebSite
 * dateModified: date of the last update of the data (last successful pipeline run), omitted if unknown
 * potentialAction: search of the site (SearchAction)
 */
export function getWebSiteStructuredData(
  baseUrl: string,
  dateModified?: string | null,
): StructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": getWebSiteId(baseUrl),
    name: SITE_NAME,
    alternateName: SITE_DOMAIN,
    url: `${baseUrl}/`,
    description: SITE_DESCRIPTION,
    inLanguage: "fr-FR",
    ...(dateModified ? { dateModified } : {}),
    // General public and health professionals
    audience: [
      { "@type": "Patient" },
      { "@type": "MedicalAudience", audienceType: "Professionnels de santé" },
    ],
    // The content applies to France (medicaments, rules)
    spatialCoverage: SPATIAL_COVERAGE,
    isAccessibleForFree: true,
    about: SITE_SECTIONS.map(({ name, path }) => ({
      "@type": "Thing",
      name,
      url: `${baseUrl}${path}`,
    })),
    publisher: getPublisher(baseUrl),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}${SEARCH_PATH}?${SEARCH_PARAM}={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
