import React, { Fragment } from "react";
import WithDefinition from "@/components/glossary/WithDefinition";
import { Definition } from "@/types/GlossaireTypes";


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

function WithGlossary({
  text,
  definitions
}: {
  text: string[];
  definitions?: Definition[]
}): React.JSX.Element {

  if(!definitions) return (<>{text}</>);

  let elements: (React.JSX.Element | string)[] = text;

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

export default WithGlossary;
