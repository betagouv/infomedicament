import React, { Fragment } from "react";
import WithDefinition from "@/components/glossary/WithDefinition";
import { Definition } from "@/types/GlossaireTypes";
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
      `(?<before>.*\\b)(?<word>${escapeRegExp(keyword.toLowerCase())}s?)(?<after>\\b.*)`, //8 - KO les accents
      "i",
    ),
  );
  if (!match || !match.groups) return [text];
  const { before, word, after } = match.groups;
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

function WithGlossary({
  text,
  definitions,
  isHeader,
}: {
  text: string[];
  definitions?: Definition[];
  isHeader?: boolean;
}): React.JSX.Element {

  if(!definitions) return (<>{text}</>);

  let elements: (React.JSX.Element | string)[] = text;

  if(isHeader){
    headerAnchorsKeys.forEach((key: string) => {
      elements = elements
        .map((element) => {
          if (typeof element !== "string") return element;
          return withHeaderAnchor(element, headerAnchorsList[key]);
        })
        .flat();
    });
  } else {
    //Find keywords for questions
    questionKeys.forEach((key: string) => {
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
    definitions.forEach((definition) => {
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
        <>
          {typeof element === 'string' 
            ? (<div key={i} dangerouslySetInnerHTML={{__html: element}}></div>)
            : (<Fragment key={i}>{element}</Fragment>)
          }          
        </>
      ))}
    </>
  );
}

export default WithGlossary;
