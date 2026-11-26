import { splitDosageReference } from "@/db/utils/substanceCatalog";
import { BreadcrumbPage } from "./breadcrumb";
import { ANSM, getWebSiteId, SPATIAL_COVERAGE, StructuredData } from "./index";

// Substance of the medicament: name and dosage of the composition (e.g. "1000 mg pour un comprimé")
export type DrugSubstance = { name: string; dosage?: string };

export type DrugData = {
  // Canonical path and name of the medicament page
  path: string;
  name: string;
  // Path of the current page: the medicament page or its detailed version (main entity of the page)
  pagePath: string;
  // Meta description of the medicament page
  description?: string;
  // Date of the content of the current page (ISO): the notice on the medicament page, the RCP on its detailed version
  pageDateModified?: string;
  cis: string;
  substances: DrugSubstance[];
  // Pharmaceutical forms of the elements (e.g. "comprimé")
  dosageForms: string[];
  // ATC class of the medicament (level 2, otherwise level 1) and its code
  atcClass?: BreadcrumbPage;
  atcCode?: string;
  // Delivery conditions: medicament on prescription (as the "Sur ordonnance" tag)
  isPrescriptionOnly: boolean;
  isAvailableGenerically: boolean;
  // Status of the marketing authorisation (AMM), e.g. "Valide"
  authorizationStatus?: string;
  // Medicament under reinforced surveillance (black triangle)
  isSurveillanceRenforcee: boolean;
  // Reimbursement rates of the presentations, e.g. "65%"
  reimbursementRates: string[];
  // Reference specialité of the generic group of the medicament
  referenceSpecialite?: BreadcrumbPage;
  // Articles linked to the medicament, as displayed on its page (title and path)
  articles?: BreadcrumbPage[];
};

// Warning of the medicaments under reinforced surveillance (as on the medicament page)
const SURVEILLANCE_RENFORCEE_WARNING =
  "Ce médicament fait l'objet d'une surveillance renforcée.";

// Identifier of the medicament (Drug) from the URL of its page: the same on its page, its detailed version,
// the articles which mention it and the indications which list it
export const getDrugId = (medicamentUrl: string): string =>
  `${medicamentUrl}#drug`;

// Value and unit (one word) of a simple dosage, e.g. "1000 mg pour un comprimé" -> 1000 "mg", "2,5 mg" -> 2.5 "mg",
// undefined otherwise (e.g. homeopathy "2CH à 30CH et 4DH à 60DH", "185 MBq à la date de calibration")
export function parseStrength(
  dosage: string,
): { value: number; unit: string } | undefined {
  const match = splitDosageReference(dosage).dosage.match(
    /^(\d[\d\s]*(?:[.,]\d+)?)\s*([^\d\s]+)$/,
  );
  if (!match) return undefined;
  const value = Number(match[1].replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(value) ? { value, unit: match[2].trim() } : undefined;
}

const toStrength = (substance: DrugSubstance): StructuredData | undefined => {
  const dosage = substance.dosage?.trim();
  if (!dosage) return undefined;
  const strength = parseStrength(dosage);
  return {
    "@type": "DrugStrength",
    activeIngredient: substance.name,
    // Value and unit if simple, otherwise the dosage as text
    ...(strength
      ? { strengthValue: strength.value, strengthUnit: strength.unit }
      : { description: dosage }),
  };
};

/**
 * Medicament page: https://schema.org/Drug
 */
export function getDrugStructuredData(
  drug: DrugData,
  baseUrl: string,
): StructuredData {
  const url = `${baseUrl}${drug.path}`;
  // A substance in several elements with the same dosage (e.g. homeopathy): once
  const substances = drug.substances.filter(
    (substance, index, all) =>
      all.findIndex(
        (other) =>
          other.name === substance.name &&
          other.dosage?.trim() === substance.dosage?.trim(),
      ) === index,
  );
  const strengths = substances.flatMap(
    (substance) => toStrength(substance) ?? [],
  );
  const dosageForms = [
    ...new Set(drug.dosageForms.map((form) => form.trim()).filter(Boolean)),
  ];
  const reimbursementRates = [
    ...new Set(
      drug.reimbursementRates.map((rate) => rate.trim()).filter(Boolean),
    ),
  ];
  return {
    "@context": "https://schema.org",
    "@type": "Drug",
    "@id": getDrugId(url),
    name: drug.name,
    ...(drug.description?.trim()
      ? { description: drug.description.trim() }
      : {}),
    url,
    // Page of the medicament (or its detailed version), part of the site
    mainEntityOfPage: {
      "@type": "MedicalWebPage",
      "@id": `${baseUrl}${drug.pagePath}`,
      isPartOf: { "@id": getWebSiteId(baseUrl) },
      ...(drug.pageDateModified ? { dateModified: drug.pageDateModified } : {}),
    },
    ...(drug.substances.length
      ? {
          activeIngredient: [
            ...new Set(drug.substances.map((substance) => substance.name)),
          ],
        }
      : {}),
    ...(strengths.length ? { availableStrength: strengths } : {}),
    ...(dosageForms.length ? { dosageForm: dosageForms.join(", ") } : {}),
    ...(drug.atcClass
      ? {
          drugClass: {
            "@type": "DrugClass",
            name: drug.atcClass.name,
            url: `${baseUrl}${drug.atcClass.path}`,
          },
        }
      : {}),
    // Codes of the medicament: CIS (French code of the specialité) and ATC
    code: [
      { "@type": "MedicalCode", codeValue: drug.cis, codingSystem: "CIS" },
      ...(drug.atcCode
        ? [
            {
              "@type": "MedicalCode",
              codeValue: drug.atcCode,
              codingSystem: "ATC",
            },
          ]
        : []),
    ],
    // Notice (information for the patient): the medicament page,
    // RCP (information for the prescriber): its detailed version
    labelDetails: url,
    prescribingInfo: `${url}/details`,
    prescriptionStatus: drug.isPrescriptionOnly
      ? "https://schema.org/PrescriptionOnly"
      : "https://schema.org/OTC",
    isAvailableGenerically: drug.isAvailableGenerically,
    // Marketing authorisation in France, by the ANSM
    ...(drug.authorizationStatus?.trim()
      ? {
          legalStatus: {
            "@type": "DrugLegalStatus",
            name: `Autorisation de mise sur le marché (AMM) : ${drug.authorizationStatus.trim()}`,
            applicableLocation: SPATIAL_COVERAGE,
          },
        }
      : {}),
    recognizingAuthority: ANSM,
    ...(drug.isSurveillanceRenforcee
      ? { warning: SURVEILLANCE_RENFORCEE_WARNING }
      : {}),
    // Reimbursement by the Assurance maladie: rates of the presentations
    ...(reimbursementRates.length
      ? {
          includedInHealthInsurancePlan: {
            "@type": "HealthInsurancePlan",
            name: "Assurance maladie",
            description: `Taux de remboursement : ${reimbursementRates.join(", ")}`,
          },
        }
      : {}),
    // Articles about the medicament (as displayed on its page)
    ...(drug.articles?.length
      ? {
          subjectOf: drug.articles.map((article) => ({
            "@type": "Article",
            headline: article.name,
            url: `${baseUrl}${article.path}`,
          })),
        }
      : {}),
    // Reference specialité of its generic group (not the medicament itself)
    ...(drug.referenceSpecialite && drug.referenceSpecialite.path !== drug.path
      ? {
          relatedDrug: {
            "@type": "Drug",
            name: drug.referenceSpecialite.name,
            url: `${baseUrl}${drug.referenceSpecialite.path}`,
          },
        }
      : {}),
  };
}
