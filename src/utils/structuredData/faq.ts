import { htmlToText, StructuredData } from "./index";

// Question of the questions box of the medicament page (as displayed)
export const MEDICAMENT_USAGE_QUESTION = "À quoi sert-il ?";

/**
 * Questions of the medicament page: https://schema.org/FAQPage
 * Only "À quoi sert-il ?": the only question with a fixed answer, the indications section of the notice
 * (the other questions are answered by a search in the notice, when clicked)
 * Undefined without answer (no indications section in the notice)
 * pagePath: path of the medicament page, indicationsHtml: indications section of its notice (see getIndicationsBlock)
 */
export function getMedicamentFaqStructuredData(
  pagePath: string,
  indicationsHtml: string | undefined,
  baseUrl: string,
): StructuredData | undefined {
  const answer = indicationsHtml ? htmlToText(indicationsHtml) : "";
  if (!answer) return undefined;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: `${baseUrl}${pagePath}`,
    mainEntity: [
      {
        "@type": "Question",
        name: MEDICAMENT_USAGE_QUESTION,
        acceptedAnswer: { "@type": "Answer", text: answer },
      },
    ],
  };
}
