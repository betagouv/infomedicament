import { describe, expect, it } from "vitest";
import { getBreadcrumbStructuredData } from "./breadcrumb";

const BASE_URL = "https://infomedicament.beta.gouv.fr";

const item = (position: number, name: string, path: string) => ({
  "@type": "ListItem",
  position,
  name,
  item: `${BASE_URL}${path}`,
});

describe("utils/structuredData - getBreadcrumbStructuredData", () => {
  it("lists the home, the section of the URL and the page", () => {
    expect(getBreadcrumbStructuredData({ path: "/substances/paracetamol-02202", name: "paracétamol" }, BASE_URL))
      .toEqual({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          item(1, "Info Médicament", "/"),
          item(2, "Toutes les substances actives", "/substances"),
          item(3, "paracétamol", "/substances/paracetamol-02202"),
        ],
      });
  });

  it("puts the ATC class of level 1 before the class of level 2", () => {
    const data = getBreadcrumbStructuredData(
      { path: "/atc/anti-douleur-n02", name: "Anti-douleur" },
      BASE_URL,
      [{ path: "/atc/systeme-nerveux-n", name: "Système nerveux" }],
    );

    expect(data.itemListElement).toEqual([
      item(1, "Info Médicament", "/"),
      item(2, "Toutes les classes de médicament", "/atc"),
      item(3, "Système nerveux", "/atc/systeme-nerveux-n"),
      item(4, "Anti-douleur", "/atc/anti-douleur-n02"),
    ]);
  });

  it("adds the parents of the page in its URL", () => {
    const data = getBreadcrumbStructuredData(
      { path: "/medicaments/doliprane-1000-mg-comprime-60234100/details", name: "Version détaillée" },
      BASE_URL,
      [{ path: "/medicaments/doliprane-1000-mg-comprime-60234100", name: "Doliprane 1000 mg, comprimé" }],
    );

    expect(data.itemListElement).toEqual([
      item(1, "Info Médicament", "/"),
      item(2, "Tous les médicaments", "/medicaments"),
      item(3, "Doliprane 1000 mg, comprimé", "/medicaments/doliprane-1000-mg-comprime-60234100"),
      item(4, "Version détaillée", "/medicaments/doliprane-1000-mg-comprime-60234100/details"),
    ]);
  });

  it("has no section for a page outside the sections, or for the section page itself", () => {
    expect(getBreadcrumbStructuredData({ path: "/a-propos", name: "À propos" }, BASE_URL).itemListElement).toEqual([
      item(1, "Info Médicament", "/"),
      item(2, "À propos", "/a-propos"),
    ]);
    expect(getBreadcrumbStructuredData({ path: "/articles", name: "Vos questions" }, BASE_URL).itemListElement)
      .toEqual([
        item(1, "Info Médicament", "/"),
        item(2, "Vos questions", "/articles"),
      ]);
  });

  it("puts the articles in their section", () => {
    const data = getBreadcrumbStructuredData({ path: "/articles/comprendre-une-notice", name: "Comprendre une notice" }, BASE_URL);

    expect(data.itemListElement).toEqual([
      item(1, "Info Médicament", "/"),
      item(2, "Vos questions", "/articles"),
      item(3, "Comprendre une notice", "/articles/comprendre-une-notice"),
    ]);
  });
});
