import { BreadcrumbPage } from "./breadcrumb";
import { getDrugId } from "./drug";
import { getWebSiteId, htmlToText, StructuredData } from "./index";

// Maximum number of medicaments in possibleTreatment: the first ones of the page
export const MAX_TREATMENTS = 20;

export type MedicalConditionData = {
  // Canonical path and name of the indication page
  path: string,
  name: string,
  // Definition of the indication (text or HTML)
  definition?: string | null,
  // Medicaments of the page (name and path of their page)
  treatments: BreadcrumbPage[],
  // Articles about the indication (title and path)
  articles: BreadcrumbPage[],
};

/**
 * Indication page: https://schema.org/MedicalCondition
 */
export function getMedicalConditionStructuredData(condition: MedicalConditionData, baseUrl: string): StructuredData {
  const url = `${baseUrl}${condition.path}`;
  const description = condition.definition ? htmlToText(condition.definition) : "";
  return {
    "@context": "https://schema.org",
    "@type": "MedicalCondition",
    "@id": `${url}#condition`,
    name: condition.name,
    ...(description ? { description } : {}),
    url,
    mainEntityOfPage: { "@type": "MedicalWebPage", "@id": url, isPartOf: { "@id": getWebSiteId(baseUrl) } },
    // Medicaments of the page, identified as their Drug (the same entity as on their page)
    ...(condition.treatments.length
      ? {
        possibleTreatment: condition.treatments.slice(0, MAX_TREATMENTS).map((treatment) => {
          const treatmentUrl = `${baseUrl}${treatment.path}`;
          return { "@type": "Drug", "@id": getDrugId(treatmentUrl), name: treatment.name, url: treatmentUrl };
        }),
      }
      : {}),
    ...(condition.articles.length
      ? {
        subjectOf: condition.articles.map((article) => ({
          "@type": "Article",
          headline: article.name,
          url: `${baseUrl}${article.path}`,
        })),
      }
      : {}),
  };
}
