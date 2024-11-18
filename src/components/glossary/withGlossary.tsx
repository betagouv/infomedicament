import "server-cli-only";

import getGlossaryDefinitions, { Definition } from "@/data/grist/glossary";
import { Fragment } from "react";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import slugify from "slugify";
import AddDefinition from "@/components/glossary/AddDefinition";

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function withDefinition(
  text: string,
  definition: Definition,
): (React.JSX.Element | string)[] {
  const match = text.match(
    new RegExp(
      `(?<before>.* )(?<word>${escapeRegExp(definition.fields.Nom_glossaire.toLowerCase())}s?)(?<after> .*)`,
      "i",
    ),
  );
  if (!match || !match.groups) return [text];
  const { before, word, after } = match.groups;

  const definitionModal = createModal({
    isOpenedByDefault: false,
    id: `Definition-${slugify(definition.fields.Nom_glossaire)}`,
  });

  return [
    before,
    <a
      key={definition.fields.Nom_glossaire}
      href={`#Definition-${slugify(definition.fields.Nom_glossaire)}`}
      aria-describedby={`Definition-${slugify(definition.fields.Nom_glossaire)}`}
      role="button"
      {...definitionModal.buttonProps}
    >
      {word}
      <AddDefinition definition={definition} />
    </a>,
    ...withDefinition(after, definition),
  ];
}

export async function withGlossary(text: string): Promise<React.JSX.Element> {
  const definitions = await getGlossaryDefinitions();

  let elements: (React.JSX.Element | string)[] = [text];

  definitions.forEach((definition) => {
    elements = elements
      .map((element) => {
        if (typeof element !== "string") return element;

        return withDefinition(element, definition);
      })
      .flat();
  });

  return (
    <>
      {elements.map((element, i) => (
        <Fragment key={i}>{element}</Fragment>
      ))}
    </>
  );
}
