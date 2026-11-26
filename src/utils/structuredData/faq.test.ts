import { describe, expect, it } from "vitest";
import { getMedicamentFaqStructuredData } from "./faq";

const BASE_URL = "https://infomedicament.beta.gouv.fr";
const PATH = "/medicaments/doliprane-1000-mg-comprime-60234100";

describe("utils/structuredData - getMedicamentFaqStructuredData", () => {
  it("answers « À quoi sert-il ? » with the indications section of the notice, as text", () => {
    const indicationsHtml =
      "<p>Ce médicament contient du paracétamol.</p><p>Il est indiqué en cas de <b>douleur</b> et/ou de fièvre.</p>";

    expect(
      getMedicamentFaqStructuredData(PATH, indicationsHtml, BASE_URL),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      url: `${BASE_URL}${PATH}`,
      mainEntity: [
        {
          "@type": "Question",
          name: "À quoi sert-il ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Ce médicament contient du paracétamol. Il est indiqué en cas de douleur et/ou de fièvre.",
          },
        },
      ],
    });
  });

  it("has no FAQ without indications section", () => {
    expect(
      getMedicamentFaqStructuredData(PATH, undefined, BASE_URL),
    ).toBeUndefined();
    expect(
      getMedicamentFaqStructuredData(PATH, "<p> </p>", BASE_URL),
    ).toBeUndefined();
  });
});
