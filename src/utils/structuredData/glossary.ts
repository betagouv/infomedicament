import slugify from "slugify";
import { htmlToText, StructuredData } from "./index";

// Name of the glossary
const GLOSSARY_NAME = "Glossaire";

// Identifier of the glossary: the same on all its pages (one page by letter)
export const getGlossaryId = (baseUrl: string): string =>
  `${baseUrl}/glossaire#glossaire`;

// Anchor of a term on its glossary page (id of its title)
export const getGlossaryTermAnchor = (name: string): string =>
  slugify(name, { lower: true, strict: true });

/**
 * Glossary page of a letter: https://schema.org/DefinedTermSet
 * The glossary with the terms of the page (https://schema.org/DefinedTerm), each with its anchor on the page
 * definitions: terms of the letter, definition in HTML
 */
export function getGlossaryStructuredData(
  letter: string,
  definitions: { name: string; definition: string }[],
  baseUrl: string,
): StructuredData {
  const glossaryId = getGlossaryId(baseUrl);
  const pageUrl = `${baseUrl}/glossaire/${encodeURIComponent(letter)}`;
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "@id": glossaryId,
    name: GLOSSARY_NAME,
    url: pageUrl,
    inLanguage: "fr-FR",
    hasDefinedTerm: definitions
      .filter(({ name }) => name.trim())
      .map(({ name, definition }) => {
        const description = htmlToText(definition);
        return {
          "@type": "DefinedTerm",
          name: name.trim(),
          ...(description ? { description } : {}),
          url: `${pageUrl}#${getGlossaryTermAnchor(name)}`,
          inDefinedTermSet: { "@id": glossaryId },
        };
      }),
  };
}
