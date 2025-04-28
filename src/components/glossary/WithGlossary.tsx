import "server-cli-only";

import getGlossaryDefinitions, { Definition } from "@/data/grist/glossary";
import React, { Fragment } from "react";
import WithDefinition from "@/components/glossary/WithDefinition";
import { headerAnchorsKeys, headerAnchorsList, questionKeys, questionsList } from "@/data/pages/notices_anchors";
import QuestionKeyword from "../medicaments/QuestionKeyword";
import { HeaderDetails } from "@/types/NoticesAnchors";

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

function withKeyword(
  text: string,
  keyword: string,
  questionId: string,
): (React.JSX.Element | string)[] {
  const match = text.match(
    new RegExp(
      `(?<before>.*)(?<word>${escapeRegExp(keyword.toLowerCase())}s?)(?<after>.*)`,
      "i",
    ),
  );
  if (!match || !match.groups) return [text];
  const { before, word, after } = match.groups;
  const excerpt = before.substring(before.length - 12)+word+after.substring(12);
  return [
    before,
    <QuestionKeyword 
      key={word}
      keyword={word} 
      questionId={questionId}
    />,
    ...withKeyword(after, keyword, questionId),
  ];
}

function withHeaderAnchor(
  text: string,
  anchorDetails: HeaderDetails,
): (React.JSX.Element | string)[] {

  const beginIndex = (text.toLowerCase()).indexOf(anchorDetails.headerTerms.begin.toLowerCase());
  if(beginIndex !== -1){
    const endIndex =(text.toLowerCase()).indexOf(anchorDetails.headerTerms.end.toLowerCase(), beginIndex + anchorDetails.headerTerms.begin.length);
    if(endIndex !== -1){
      return [
        <span key={anchorDetails.id} id={anchorDetails.id} className={`highlight-keyword-${anchorDetails.id} highlight-header scroll-m-150`}>{text}</span>,
      ];
    }
  }
  return [text];
}

export async function WithGlossary({
  text,
  isHeader,
}: {
  text: string;
  isHeader?: boolean;
}): Promise<React.JSX.Element> {

  let elements: (React.JSX.Element | string)[] = [text];
  const definitions = (await getGlossaryDefinitions()).filter(
    (d) => d.fields.A_publier,
  );

  if(isHeader){

    await headerAnchorsKeys.forEach((key: string) => {
      elements = elements
        .map((element) => {
          if (typeof element !== "string") return element;
          return withHeaderAnchor(element, headerAnchorsList[key]);
        })
        .flat();
    });
  } else {
    //Find keywords for questions
    await questionKeys.forEach((key: string) => {
      questionsList[key].keywords && questionsList[key].keywords.forEach((keyword: string) => {
        elements = elements
          .map((element) => {
            if (typeof element !== "string") return element;
            return withKeyword(element, keyword, key);
          })
          .flat();
      });
    });

    //Find definitions
    await definitions.forEach((definition) => {
      elements = elements
        .map((element) => {
          if (typeof element !== "string") return element;
          return withDefinition(element, definition);
        })
        .flat();
    });
  }

  return (
    <>
      {elements.map((element, i) => (
        <Fragment key={i}>{element}</Fragment>
      ))}
    </>
  );
}
