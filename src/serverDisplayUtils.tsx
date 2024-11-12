import "server-cli-only";
import { Fragment } from "react";
import slugify from "slugify";

import { getGristTableData } from "@/data/grist";
import { createModal } from "@codegouvfr/react-dsfr/Modal";

interface Definition {
  fields: {
    Nom_glossaire: string;
    Definition_glossaire: string;
    Source: string;
  };
}

function withDefinition(
  text: string,
  definition: Definition,
): (React.JSX.Element | string)[] {
  const [before, after] = text.split(
    definition.fields.Nom_glossaire.toLowerCase(),
  );
  if (!after) return [text];

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
      {definition.fields.Nom_glossaire.toLowerCase()}
    </a>,
    ...withDefinition(after, definition),
  ];
}

export async function withGlossary(text: string): Promise<React.JSX.Element> {
  const definitions = (await getGristTableData("Glossaire", [
    "Nom_glossaire",
    "Definition_glossaire",
    "Source",
  ])) as Definition[];

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
