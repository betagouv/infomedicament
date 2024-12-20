import "server-cli-only";

import getGlossaryDefinitions, { Definition } from "@/data/grist/glossary";
import React, { Fragment } from "react";
import WithDefinition from "@/components/glossary/WithDefinition";

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
  return [
    before,
    <WithDefinition key={word} definition={definition} word={word} />,
    ...withDefinition(after, definition),
  ];
}

export async function WithGlossary({
  text,
}: {
  text: string;
}): Promise<React.JSX.Element> {
  const definitions = (await getGlossaryDefinitions()).filter(
    (d) => d.fields.A_publier,
  );

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
