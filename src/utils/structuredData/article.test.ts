import { describe, expect, it } from "vitest";
import { countWords, getArticleStructuredData, MAX_MENTIONS } from "./article";

const BASE_URL = "https://infomedicament.beta.gouv.fr";
const PUBLISHER = {
  "@type": "Organization",
  "@id": `${BASE_URL}/#organization`,
  name: "Info Médicament",
  url: BASE_URL,
  logo: { "@type": "ImageObject", url: `${BASE_URL}/img/logo.svg` },
  parentOrganization: {
    "@type": "GovernmentOrganization",
    name: "ANSM",
    alternateName: "Agence nationale de sécurité du médicament et des produits de santé",
    url: "https://ansm.sante.fr",
  },
};

const article = {
  slug: "les-medicaments-et-la-grossesse",
  title: "Les médicaments et la grossesse",
  description: "Ce qu'il faut savoir avant de prendre un médicament enceinte.",
  category: "Grossesse et allaitement",
  source: "ANSM",
  canonicalUrl: "https://ansm.sante.fr/dossiers-thematiques/medicaments-et-grossesse",
  image: "grossesse",
  content: "# Les précautions\n\nDemandez **conseil** à votre [pharmacien](https://www.sante.fr).",
};

describe("utils/structuredData - getArticleStructuredData", () => {
  it("describes the article with absolute URLs", () => {
    expect(getArticleStructuredData(article, BASE_URL)).toEqual({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Les médicaments et la grossesse",
      description: "Ce qu'il faut savoir avant de prendre un médicament enceinte.",
      url: `${BASE_URL}/articles/les-medicaments-et-la-grossesse`,
      mainEntityOfPage: {
        "@type": "MedicalWebPage",
        "@id": `${BASE_URL}/articles/les-medicaments-et-la-grossesse`,
        audience: { "@type": "Patient" },
        isPartOf: { "@id": `${BASE_URL}/#website` },
      },
      image: `${BASE_URL}/img/article_covers/grossesse.webp`,
      articleSection: "Grossesse et allaitement",
      wordCount: 7,
      inLanguage: "fr-FR",
      spatialCoverage: { "@type": "Country", name: "France" },
      isAccessibleForFree: true,
      author: PUBLISHER,
      publisher: PUBLISHER,
      isBasedOn: {
        "@type": "WebPage",
        url: "https://ansm.sante.fr/dossiers-thematiques/medicaments-et-grossesse",
        publisher: { "@type": "Organization", name: "ANSM" },
      },
    });
  });

  it("has Info Médicament as author of its own articles, without external source", () => {
    const data = getArticleStructuredData(
      { ...article, source: "infomedicament.beta.gouv.fr", canonicalUrl: "" },
      BASE_URL,
    );

    expect(data.author).toEqual(PUBLISHER);
    expect(data).not.toHaveProperty("isBasedOn");
  });

  it("has Info Médicament as author of the articles based on an external source", () => {
    const data = getArticleStructuredData({ ...article, source: "Santé.fr" }, BASE_URL);

    expect(data.author).toEqual(PUBLISHER);
    expect(data.isBasedOn).toMatchObject({ publisher: { "@type": "Organization", name: "Santé.fr" } });
  });

  it("omits the empty description, image and category", () => {
    const data = getArticleStructuredData(
      { ...article, description: "", image: undefined, category: " " },
      BASE_URL,
    );

    expect(data).not.toHaveProperty("description");
    expect(data).not.toHaveProperty("image");
    expect(data).not.toHaveProperty("articleSection");
  });

  it("describes the cover with its size if known", () => {
    const data = getArticleStructuredData(article, BASE_URL, { imageSize: { width: 1176, height: 662 } });

    expect(data.image).toEqual({
      "@type": "ImageObject",
      url: `${BASE_URL}/img/article_covers/grossesse.webp`,
      width: 1176,
      height: 662,
    });
  });

  it("links the pages of the site about the article and mentioned in the article", () => {
    const data = getArticleStructuredData(article, BASE_URL, {
      about: [
        { type: "MedicalCondition", name: "Migraine", path: "/indications/migraine-67" },
        { type: "DrugClass", name: "Antalgiques", path: "/atc/antalgiques-n02" },
      ],
      mentions: [{ type: "Drug", name: "paracétamol", path: "/substances/paracetamol-02202" }],
    });

    expect(data.about).toEqual([
      { "@type": "MedicalCondition", name: "Migraine", url: `${BASE_URL}/indications/migraine-67` },
      { "@type": "DrugClass", name: "Antalgiques", url: `${BASE_URL}/atc/antalgiques-n02` },
    ]);
    expect(data.mentions).toEqual([
      { "@type": "Drug", name: "paracétamol", url: `${BASE_URL}/substances/paracetamol-02202` },
    ]);
  });

  it("keeps only the first mentions", () => {
    const mentions = Array.from({ length: MAX_MENTIONS + 5 }, (_, index) => ({
      type: "Drug" as const,
      name: `substance ${index}`,
      path: `/substances/substance-${index}`,
    }));
    const data = getArticleStructuredData(article, BASE_URL, { mentions });

    expect(data.mentions).toHaveLength(MAX_MENTIONS);
    expect((data.mentions as { name: string }[])[0].name).toBe("substance 0");
  });

  it("identifies the mentioned medicaments as their Drug, the same entity as on their page", () => {
    const data = getArticleStructuredData(article, BASE_URL, {
      mentions: [
        { type: "Drug", name: "Doliprane 1000 mg, comprimé", path: "/medicaments/doliprane-1000-mg-comprime-60234100" },
        { type: "Drug", name: "paracétamol", path: "/substances/paracetamol-02202" },
      ],
    });

    expect(data.mentions).toEqual([
      {
        "@type": "Drug",
        "@id": `${BASE_URL}/medicaments/doliprane-1000-mg-comprime-60234100#drug`,
        name: "Doliprane 1000 mg, comprimé",
        url: `${BASE_URL}/medicaments/doliprane-1000-mg-comprime-60234100`,
      },
      { "@type": "Drug", name: "paracétamol", url: `${BASE_URL}/substances/paracetamol-02202` },
    ]);
  });

  it("omits about and mentions without linked page", () => {
    const data = getArticleStructuredData(article, BASE_URL, { about: [], mentions: [] });

    expect(data).not.toHaveProperty("about");
    expect(data).not.toHaveProperty("mentions");
  });
});

describe("utils/structuredData - countWords", () => {
  it("counts the words of the text, without the Markdown syntax", () => {
    const markdown = [
      "### Deux médicaments à ne pas confondre.",
      "",
      ">### À retenir :",
      ">- Le **paracétamol** est le premier choix.",
      "",
      "| Âge | Dose |",
      "| --- | --- |",
      "Voir [la notice](https://example.com/notice) ou https://example.com.",
    ].join("\n");

    // Deux médicaments à ne pas confondre (6) + À retenir (2) + Le paracétamol est le premier choix (6)
    // + Âge Dose (2) + Voir la notice ou (4)
    expect(countWords(markdown)).toBe(20);
  });

  it("does not count the HTML tags and the scripts", () => {
    expect(countWords('Trier ses médicaments <script src="https://example.com/iframe.js">var a = 1;</script> <div>ici</div>'))
      .toBe(4);
  });

  it("counts a French elision as one word", () => {
    expect(countWords("L’ibuprofène est un anti-inflammatoire")).toBe(4);
  });
});
