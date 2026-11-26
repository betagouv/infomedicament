import { describe, expect, it } from "vitest";
import { getGlossaryStructuredData } from "./glossary";
import { htmlToText } from "./index";

const BASE_URL = "https://infomedicament.beta.gouv.fr";

describe("utils/structuredData - getGlossaryStructuredData", () => {
  it("describes the glossary with the terms of the page, each with its anchor", () => {
    const definitions = [
      {
        name: "Abrogation",
        definition:
          "Décision du Directeur Général de l'ANSM rendant définitivement inactive l'autorisation.",
      },
      {
        name: "Accès direct ou libre accès (médicament en)",
        definition:
          "<p>Médicaments placés <strong>devant</strong> le comptoir.</p>",
      },
    ];

    expect(getGlossaryStructuredData("A", definitions, BASE_URL)).toEqual({
      "@context": "https://schema.org",
      "@type": "DefinedTermSet",
      "@id": `${BASE_URL}/glossaire#glossaire`,
      name: "Glossaire",
      url: `${BASE_URL}/glossaire/A`,
      inLanguage: "fr-FR",
      hasDefinedTerm: [
        {
          "@type": "DefinedTerm",
          name: "Abrogation",
          description:
            "Décision du Directeur Général de l'ANSM rendant définitivement inactive l'autorisation.",
          url: `${BASE_URL}/glossaire/A#abrogation`,
          inDefinedTermSet: { "@id": `${BASE_URL}/glossaire#glossaire` },
        },
        {
          "@type": "DefinedTerm",
          name: "Accès direct ou libre accès (médicament en)",
          description: "Médicaments placés devant le comptoir.",
          url: `${BASE_URL}/glossaire/A#acces-direct-ou-libre-acces-medicament-en`,
          inDefinedTermSet: { "@id": `${BASE_URL}/glossaire#glossaire` },
        },
      ],
    });
  });

  it("ignores the terms without name and omits the empty definitions", () => {
    const data = getGlossaryStructuredData(
      "B",
      [
        { name: " ", definition: "x" },
        { name: "Bioéquivalence", definition: "" },
      ],
      BASE_URL,
    );

    expect(data.hasDefinedTerm).toEqual([
      {
        "@type": "DefinedTerm",
        name: "Bioéquivalence",
        url: `${BASE_URL}/glossaire/B#bioequivalence`,
        inDefinedTermSet: { "@id": `${BASE_URL}/glossaire#glossaire` },
      },
    ]);
  });
});

describe("utils/structuredData - htmlToText", () => {
  it("removes the tags, decodes the entities and collapses the spaces", () => {
    expect(
      htmlToText(
        "<p>Premier&nbsp;point</p><ul><li>l&rsquo;un</li><li>l&#39;autre &amp; plus</li></ul>",
      ),
    ).toBe("Premier point l’un l'autre & plus");
  });

  it("removes the scripts and the nested tags, with an HTML parser", () => {
    expect(
      htmlToText(
        "Texte <script>alert(1)</script><scr<script>ipt>alert(2)</script> fin",
      ),
    ).not.toContain("<script");
    expect(htmlToText("Texte <script>alert(1)</script> fin")).toBe("Texte fin");
  });
});
