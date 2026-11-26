import { BreadcrumbPage } from "./breadcrumb";
import { getWebSiteId, htmlToText, StructuredData } from "./index";

// Maximum number of substances in drug: the first ones of the page
export const MAX_CLASS_DRUGS = 50;

export type DrugClassData = {
  // Canonical path and name of the ATC class page
  path: string;
  name: string;
  // ATC code of the class, e.g. "N02"
  code: string;
  description?: string | null;
  // Substances of the class (class of level 2, none for a class of level 1): name and path of their page
  drugs: BreadcrumbPage[];
  // Articles about the class (title and path)
  articles: BreadcrumbPage[];
};

/**
 * ATC class page: https://schema.org/DrugClass
 * No subclasses for a class of level 1: no property for them in DrugClass (see BreadcrumbList for the hierarchy)
 */
export function getDrugClassStructuredData(
  drugClass: DrugClassData,
  baseUrl: string,
): StructuredData {
  const url = `${baseUrl}${drugClass.path}`;
  const description = drugClass.description
    ? htmlToText(drugClass.description)
    : "";
  return {
    "@context": "https://schema.org",
    "@type": "DrugClass",
    "@id": `${url}#class`,
    name: drugClass.name,
    ...(description ? { description } : {}),
    url,
    code: {
      "@type": "MedicalCode",
      codeValue: drugClass.code,
      codingSystem: "ATC",
    },
    mainEntityOfPage: {
      "@type": "MedicalWebPage",
      "@id": url,
      isPartOf: { "@id": getWebSiteId(baseUrl) },
    },
    // Substances of the class (level 2)
    ...(drugClass.drugs.length
      ? {
          drug: drugClass.drugs.slice(0, MAX_CLASS_DRUGS).map((drug) => ({
            "@type": "Drug",
            name: drug.name,
            url: `${baseUrl}${drug.path}`,
          })),
        }
      : {}),
    ...(drugClass.articles.length
      ? {
          subjectOf: drugClass.articles.map((article) => ({
            "@type": "Article",
            headline: article.name,
            url: `${baseUrl}${article.path}`,
          })),
        }
      : {}),
  };
}
