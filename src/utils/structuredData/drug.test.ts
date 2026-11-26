import { describe, expect, it } from "vitest";
import { getDrugStructuredData, parseStrength } from "./drug";

const BASE_URL = "https://infomedicament.beta.gouv.fr";

const ANSM = {
  "@type": "GovernmentOrganization",
  name: "ANSM",
  alternateName:
    "Agence nationale de sécurité du médicament et des produits de santé",
  url: "https://ansm.sante.fr",
};

const drug = {
  path: "/medicaments/doliprane-1000-mg-comprime-60234100",
  name: "Doliprane 1000 mg, comprimé",
  pagePath: "/medicaments/doliprane-1000-mg-comprime-60234100",
  description:
    "Doliprane 1000 mg : notice, effets indésirables et précautions.",
  cis: "60234100",
  substances: [{ name: "paracétamol", dosage: "1000 mg pour un comprimé" }],
  dosageForms: ["comprimé"],
  atcClass: { name: "Anti-douleur", path: "/atc/anti-douleur-n02" },
  atcCode: "N02BE01",
  isPrescriptionOnly: false,
  isAvailableGenerically: true,
  authorizationStatus: "Valide",
  isSurveillanceRenforcee: false,
  reimbursementRates: ["65%", "65%"],
};

describe("utils/structuredData - getDrugStructuredData", () => {
  it("describes the medicament", () => {
    expect(getDrugStructuredData(drug, BASE_URL)).toEqual({
      "@context": "https://schema.org",
      "@type": "Drug",
      "@id": `${BASE_URL}/medicaments/doliprane-1000-mg-comprime-60234100#drug`,
      name: "Doliprane 1000 mg, comprimé",
      description:
        "Doliprane 1000 mg : notice, effets indésirables et précautions.",
      url: `${BASE_URL}/medicaments/doliprane-1000-mg-comprime-60234100`,
      mainEntityOfPage: {
        "@type": "MedicalWebPage",
        "@id": `${BASE_URL}/medicaments/doliprane-1000-mg-comprime-60234100`,
        isPartOf: { "@id": `${BASE_URL}/#website` },
      },
      activeIngredient: ["paracétamol"],
      availableStrength: [
        {
          "@type": "DrugStrength",
          activeIngredient: "paracétamol",
          strengthValue: 1000,
          strengthUnit: "mg",
        },
      ],
      dosageForm: "comprimé",
      drugClass: {
        "@type": "DrugClass",
        name: "Anti-douleur",
        url: `${BASE_URL}/atc/anti-douleur-n02`,
      },
      code: [
        { "@type": "MedicalCode", codeValue: "60234100", codingSystem: "CIS" },
        { "@type": "MedicalCode", codeValue: "N02BE01", codingSystem: "ATC" },
      ],
      labelDetails: `${BASE_URL}/medicaments/doliprane-1000-mg-comprime-60234100`,
      prescribingInfo: `${BASE_URL}/medicaments/doliprane-1000-mg-comprime-60234100/details`,
      prescriptionStatus: "https://schema.org/OTC",
      isAvailableGenerically: true,
      legalStatus: {
        "@type": "DrugLegalStatus",
        name: "Autorisation de mise sur le marché (AMM) : Valide",
        applicableLocation: { "@type": "Country", name: "France" },
      },
      recognizingAuthority: ANSM,
      includedInHealthInsurancePlan: {
        "@type": "HealthInsurancePlan",
        name: "Assurance maladie",
        description: "Taux de remboursement : 65%",
      },
    });
  });

  it("has the detailed version as page, with the medicament as URL", () => {
    const data = getDrugStructuredData(
      { ...drug, pagePath: `${drug.path}/details` },
      BASE_URL,
    );

    expect(data.url).toBe(`${BASE_URL}${drug.path}`);
    expect(data.mainEntityOfPage).toMatchObject({
      "@id": `${BASE_URL}${drug.path}/details`,
    });
    // Same notice and RCP links on both pages
    expect(data.labelDetails).toBe(`${BASE_URL}${drug.path}`);
    expect(data.prescribingInfo).toBe(`${BASE_URL}${drug.path}/details`);
  });

  it("dates the page with the date of the notice", () => {
    expect(
      getDrugStructuredData(
        { ...drug, pageDateModified: "2025-08-25" },
        BASE_URL,
      ).mainEntityOfPage,
    ).toEqual({
      "@type": "MedicalWebPage",
      "@id": `${BASE_URL}${drug.path}`,
      isPartOf: { "@id": `${BASE_URL}/#website` },
      dateModified: "2025-08-25",
    });
  });

  it("warns about the reinforced surveillance", () => {
    expect(
      getDrugStructuredData(
        { ...drug, isSurveillanceRenforcee: true },
        BASE_URL,
      ).warning,
    ).toBe("Ce médicament fait l'objet d'une surveillance renforcée.");
  });

  it("links the reference specialité of the generic group, not the medicament itself", () => {
    const reference = {
      name: "Dafalgan Codeine, comprimé pelliculé",
      path: "/medicaments/dafalgan-codeine-comprime-pellicule-66003374",
    };

    expect(
      getDrugStructuredData(
        { ...drug, referenceSpecialite: reference },
        BASE_URL,
      ).relatedDrug,
    ).toEqual({
      "@type": "Drug",
      name: "Dafalgan Codeine, comprimé pelliculé",
      url: `${BASE_URL}/medicaments/dafalgan-codeine-comprime-pellicule-66003374`,
    });
    expect(
      getDrugStructuredData(
        { ...drug, referenceSpecialite: { name: drug.name, path: drug.path } },
        BASE_URL,
      ),
    ).not.toHaveProperty("relatedDrug");
  });

  it("lists the articles about the medicament", () => {
    const data = getDrugStructuredData(
      {
        ...drug,
        articles: [
          {
            name: "Paracétamol ou ibuprofène : quelles différences ?",
            path: "/articles/paracetamol-ou-ibuprofene",
          },
        ],
      },
      BASE_URL,
    );

    expect(data.subjectOf).toEqual([
      {
        "@type": "Article",
        headline: "Paracétamol ou ibuprofène : quelles différences ?",
        url: `${BASE_URL}/articles/paracetamol-ou-ibuprofene`,
      },
    ]);
    expect(
      getDrugStructuredData({ ...drug, articles: [] }, BASE_URL),
    ).not.toHaveProperty("subjectOf");
  });

  it("omits the empty description, authorization status and reimbursement, and the warning", () => {
    const data = getDrugStructuredData(
      {
        ...drug,
        description: " ",
        authorizationStatus: undefined,
        reimbursementRates: [],
      },
      BASE_URL,
    );

    expect(data).not.toHaveProperty("description");
    expect(data).not.toHaveProperty("legalStatus");
    expect(data).not.toHaveProperty("includedInHealthInsurancePlan");
    expect(data).not.toHaveProperty("warning");
    expect(data.recognizingAuthority).toEqual(ANSM);
  });

  it("is on prescription with delivery conditions", () => {
    expect(
      getDrugStructuredData({ ...drug, isPrescriptionOnly: true }, BASE_URL)
        .prescriptionStatus,
    ).toBe("https://schema.org/PrescriptionOnly");
  });

  it("keeps the complex dosages as text, and each substance and dosage once", () => {
    const data = getDrugStructuredData(
      {
        ...drug,
        substances: [
          { name: "arnica montana", dosage: "2CH à 30CH et 4DH à 60DH" },
          { name: "arnica montana", dosage: "2CH à 30CH et 4DH à 60DH" },
          { name: "sans dosage", dosage: "" },
        ],
        dosageForms: ["granules", "granules", "globules"],
      },
      BASE_URL,
    );

    expect(data.activeIngredient).toEqual(["arnica montana", "sans dosage"]);
    expect(data.availableStrength).toEqual([
      {
        "@type": "DrugStrength",
        activeIngredient: "arnica montana",
        description: "2CH à 30CH et 4DH à 60DH",
      },
    ]);
    expect(data.dosageForm).toBe("granules, globules");
  });

  it("omits the ATC class and code if unknown", () => {
    const data = getDrugStructuredData(
      { ...drug, atcClass: undefined, atcCode: undefined },
      BASE_URL,
    );

    expect(data).not.toHaveProperty("drugClass");
    expect(data.code).toEqual([
      { "@type": "MedicalCode", codeValue: "60234100", codingSystem: "CIS" },
    ]);
  });
});

describe("utils/structuredData - parseStrength", () => {
  it("reads the value and the unit of a simple dosage", () => {
    expect(parseStrength("1000 mg pour un comprimé")).toEqual({
      value: 1000,
      unit: "mg",
    });
    expect(parseStrength("2,5 mg")).toEqual({ value: 2.5, unit: "mg" });
    expect(parseStrength("500 000 UI pour un flacon")).toEqual({
      value: 500000,
      unit: "UI",
    });
    expect(parseStrength("0,1 g pour 100 ml")).toEqual({
      value: 0.1,
      unit: "g",
    });
  });

  it("does not read the complex dosages", () => {
    expect(parseStrength("2CH à 30CH et 4DH à 60DH")).toBeUndefined();
    // Digits in the unit, unit of several words
    expect(parseStrength("0,1 g/100 ml")).toBeUndefined();
    expect(parseStrength("185 MBq à la date de calibration")).toBeUndefined();
    expect(parseStrength("")).toBeUndefined();
  });
});
