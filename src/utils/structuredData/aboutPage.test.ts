import { describe, expect, it } from "vitest";
import { getAboutPageStructuredData } from "./aboutPage";

const BASE_URL = "https://infomedicament.beta.gouv.fr";

describe("utils/structuredData - getAboutPageStructuredData", () => {
  it("describes the page about Info Médicament, part of the site", () => {
    const data = getAboutPageStructuredData({ path: "/a-propos", name: "À propos", description: "Découvrez Info Médicament." }, BASE_URL);

    expect(data).toMatchObject({
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "@id": `${BASE_URL}/a-propos`,
      url: `${BASE_URL}/a-propos`,
      name: "À propos",
      description: "Découvrez Info Médicament.",
      inLanguage: "fr-FR",
      isPartOf: { "@id": `${BASE_URL}/#website` },
      about: { "@type": "Organization", "@id": `${BASE_URL}/#organization`, name: "Info Médicament" },
    });
  });
});
