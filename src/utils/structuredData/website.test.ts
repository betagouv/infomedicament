import { describe, expect, it } from "vitest";
import { getWebSiteStructuredData, SITE_DESCRIPTION } from "./website";

const BASE_URL = "https://infomedicament.beta.gouv.fr";

describe("utils/structuredData - getWebSiteStructuredData", () => {
  it("describes the site, its sections and its search", () => {
    expect(
      getWebSiteStructuredData(BASE_URL, "2026-11-20T03:12:00.000Z"),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      name: "Info Médicament",
      alternateName: "infomedicament.beta.gouv.fr",
      url: `${BASE_URL}/`,
      description: SITE_DESCRIPTION,
      inLanguage: "fr-FR",
      dateModified: "2026-11-20T03:12:00.000Z",
      audience: [
        { "@type": "Patient" },
        { "@type": "MedicalAudience", audienceType: "Professionnels de santé" },
      ],
      spatialCoverage: { "@type": "Country", name: "France" },
      isAccessibleForFree: true,
      about: [
        {
          "@type": "Thing",
          name: "Médicaments",
          url: `${BASE_URL}/medicaments`,
        },
        {
          "@type": "Thing",
          name: "Substances actives",
          url: `${BASE_URL}/substances`,
        },
        {
          "@type": "Thing",
          name: "Indications",
          url: `${BASE_URL}/indications`,
        },
        {
          "@type": "Thing",
          name: "Classes de médicaments (ATC)",
          url: `${BASE_URL}/atc`,
        },
        {
          "@type": "Thing",
          name: "Médicaments génériques",
          url: `${BASE_URL}/generiques`,
        },
      ],
      publisher: {
        "@type": "Organization",
        "@id": `${BASE_URL}/#organization`,
        name: "Info Médicament",
        url: BASE_URL,
        logo: { "@type": "ImageObject", url: `${BASE_URL}/img/logo.svg` },
        parentOrganization: {
          "@type": "GovernmentOrganization",
          name: "ANSM",
          alternateName:
            "Agence nationale de sécurité du médicament et des produits de santé",
          url: "https://ansm.sante.fr",
        },
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${BASE_URL}/rechercher?s={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    });
  });

  it("omits the date of modification if unknown", () => {
    expect(getWebSiteStructuredData(BASE_URL, null)).not.toHaveProperty(
      "dateModified",
    );
    expect(getWebSiteStructuredData(BASE_URL)).not.toHaveProperty(
      "dateModified",
    );
  });
});
