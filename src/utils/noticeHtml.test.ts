import { describe, expect, it } from "vitest";
import { getIndicationsBlock } from "./noticeHtml";

describe("getIndicationsBlock", () => {
  it("preserves every element marked as an indication", () => {
    const contentHtml = `
      <h2>1. Qu'est-ce que ce médicament ?</h2>
      <p data-document-role="indication">Ce médicament est indiqué pour :</p>
      <p>Un contenu intermédiaire sans rapport.</p>
      <ul data-document-role="indication"><li><strong>la douleur</strong></li></ul>
      <h2>2. Informations nécessaires</h2>
      <p>Ne prenez jamais ce médicament.</p>
    `;

    expect(getIndicationsBlock(contentHtml)).toBe(
      '<p data-document-role="indication">Ce médicament est indiqué pour :</p><ul data-document-role="indication"><li><strong>la douleur</strong></li></ul>',
    );
  });

  it("returns undefined when no element is marked as an indication", () => {
    expect(getIndicationsBlock("<h2>Une autre section</h2>")).toBeUndefined();
  });
});
