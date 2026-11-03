import React from "react";
import WithDefinition from "@/components/glossary/WithDefinition";
import { Definition } from "@/types/GlossaireTypes";

export function getDefinition(definitions: Definition[], definitionName: string): Definition | undefined {
  return definitions.find((definition) => definition.nom === definitionName);
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Links each occurrence of the definition word (or its plural) in the text to its definition
export function withDefinition(
  text: string,
  definition: Definition,
): (React.JSX.Element | string)[] {
  const match = text.match(
    new RegExp(
      `(?<before>.*?\\b)(?<word>${escapeRegExp(definition.nom.toLowerCase())}s?)(?<after>\\b.*)`,
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

// Links each occurrence of the definitions words in the texts of the children (not in the nested elements)
export function withDefinitions(
  children: React.ReactNode,
  definitions: Definition[],
): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child !== "string") return child;
    let elements: (React.JSX.Element | string)[] = [child];
    definitions.forEach((definition) => {
      elements = elements.flatMap((element) =>
        typeof element === "string" ? withDefinition(element, definition) : [element],
      );
    });
    return elements.map((element, index) => <React.Fragment key={index}>{element}</React.Fragment>);
  });
}
