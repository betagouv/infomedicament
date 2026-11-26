import { describe, expect, it } from "vitest";
import { getMedicalConditionStructuredData, MAX_TREATMENTS } from "./medicalCondition";

const BASE_URL = "https://infomedicament.beta.gouv.fr";
const URL = `${BASE_URL}/indications/migraine-67`;

const condition = {
  path: "/indications/migraine-67",
  name: "Migraine",
  definition: "Céphalée sévère et récurrente, souvent accompagnée de nausées.",
  treatments: [{ name: "Doliprane 1000 mg, comprimé", path: "/medicaments/doliprane-1000-mg-comprime-60234100" }],
  articles: [{ name: "Paracétamol ou ibuprofène : quelles différences ?", path: "/articles/paracetamol-ou-ibuprofene" }],
};

describe("utils/structuredData - getMedicalConditionStructuredData", () => {
  it("describes the indication, its medicaments as their Drug and its articles", () => {
    expect(getMedicalConditionStructuredData(condition, BASE_URL)).toEqual({
      "@context": "https://schema.org",
      "@type": "MedicalCondition",
      "@id": `${URL}#condition`,
      name: "Migraine",
      description: "Céphalée sévère et récurrente, souvent accompagnée de nausées.",
      url: URL,
      mainEntityOfPage: { "@type": "MedicalWebPage", "@id": URL, isPartOf: { "@id": `${BASE_URL}/#website` } },
      possibleTreatment: [
        {
          "@type": "Drug",
          "@id": `${BASE_URL}/medicaments/doliprane-1000-mg-comprime-60234100#drug`,
          name: "Doliprane 1000 mg, comprimé",
          url: `${BASE_URL}/medicaments/doliprane-1000-mg-comprime-60234100`,
        },
      ],
      subjectOf: [
        { "@type": "Article", headline: "Paracétamol ou ibuprofène : quelles différences ?", url: `${BASE_URL}/articles/paracetamol-ou-ibuprofene` },
      ],
    });
  });

  it("keeps only the first medicaments", () => {
    const treatments = Array.from({ length: MAX_TREATMENTS + 5 }, (_, index) => ({ name: `M${index}`, path: `/medicaments/m-${index}` }));

    expect(getMedicalConditionStructuredData({ ...condition, treatments }, BASE_URL).possibleTreatment).toHaveLength(MAX_TREATMENTS);
  });

  it("omits the empty definition, medicaments and articles", () => {
    const data = getMedicalConditionStructuredData({ ...condition, definition: null, treatments: [], articles: [] }, BASE_URL);

    expect(data).not.toHaveProperty("description");
    expect(data).not.toHaveProperty("possibleTreatment");
    expect(data).not.toHaveProperty("subjectOf");
  });
});
