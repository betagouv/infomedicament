import { describe, expect, it } from "vitest";
import { getDrugClassStructuredData, MAX_CLASS_DRUGS } from "./drugClass";

const BASE_URL = "https://infomedicament.beta.gouv.fr";
const URL = `${BASE_URL}/atc/anti-douleur-n02`;

const drugClass = {
  path: "/atc/anti-douleur-n02",
  name: "Anti-douleur",
  code: "N02",
  description: "Médicaments contre la douleur.",
  drugs: [{ name: "paracétamol", path: "/substances/paracetamol-02202" }],
  articles: [
    {
      name: "Paracétamol ou ibuprofène : quelles différences ?",
      path: "/articles/paracetamol-ou-ibuprofene",
    },
  ],
};

describe("utils/structuredData - getDrugClassStructuredData", () => {
  it("describes the ATC class, its substances and its articles", () => {
    expect(getDrugClassStructuredData(drugClass, BASE_URL)).toEqual({
      "@context": "https://schema.org",
      "@type": "DrugClass",
      "@id": `${URL}#class`,
      name: "Anti-douleur",
      description: "Médicaments contre la douleur.",
      url: URL,
      code: { "@type": "MedicalCode", codeValue: "N02", codingSystem: "ATC" },
      mainEntityOfPage: {
        "@type": "MedicalWebPage",
        "@id": URL,
        isPartOf: { "@id": `${BASE_URL}/#website` },
      },
      drug: [
        {
          "@type": "Drug",
          name: "paracétamol",
          url: `${BASE_URL}/substances/paracetamol-02202`,
        },
      ],
      subjectOf: [
        {
          "@type": "Article",
          headline: "Paracétamol ou ibuprofène : quelles différences ?",
          url: `${BASE_URL}/articles/paracetamol-ou-ibuprofene`,
        },
      ],
    });
  });

  it("keeps only the first substances", () => {
    const drugs = Array.from({ length: MAX_CLASS_DRUGS + 5 }, (_, index) => ({
      name: `S${index}`,
      path: `/substances/s-${index}`,
    }));

    expect(
      getDrugClassStructuredData({ ...drugClass, drugs }, BASE_URL).drug,
    ).toHaveLength(MAX_CLASS_DRUGS);
  });

  it("omits the empty description, substances (class of level 1) and articles", () => {
    const data = getDrugClassStructuredData(
      { ...drugClass, description: "", drugs: [], articles: [] },
      BASE_URL,
    );

    expect(data).not.toHaveProperty("description");
    expect(data).not.toHaveProperty("drug");
    expect(data).not.toHaveProperty("subjectOf");
  });
});
