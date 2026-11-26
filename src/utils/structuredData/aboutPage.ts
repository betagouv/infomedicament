import { getPublisher, getWebSiteId, StructuredData } from "./index";

/**
 * About page: https://schema.org/AboutPage
 * About Info Médicament (Organization, service of the ANSM), part of the site
 */
export function getAboutPageStructuredData(
  page: { path: string; name: string; description: string },
  baseUrl: string,
): StructuredData {
  const url = `${baseUrl}${page.path}`;
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": url,
    url,
    name: page.name,
    description: page.description,
    inLanguage: "fr-FR",
    isPartOf: { "@id": getWebSiteId(baseUrl) },
    about: getPublisher(baseUrl),
  };
}
