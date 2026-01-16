"use client";

import React, { Fragment } from "react";
import WithDefinition from "@/components/glossary/WithDefinition";
import { Definition } from "@/types/GlossaireTypes";
import { questionKeys, questionsList } from "@/data/pages/notices_anchors";
import QuestionKeyword from "../medicaments/QuestionKeyword";
import { QuestionAnchors } from "@/types/NoticesAnchors";

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function withDefinition(
  text: string,
  definition: Definition,
): (React.JSX.Element | string)[] {
  const match = text.match(
    new RegExp(
      `(?<before>.*\\b)(?<word>${escapeRegExp(definition.fields.Nom_glossaire.toLowerCase())}s?)(?<after>\\b.*)`,
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
  headerId: string,
  questionDetails: QuestionAnchors,
): (React.JSX.Element | string)[] {

  if (questionDetails.headerId && (headerId === questionDetails.headerId)) {
    return [
      <span key={questionDetails.headerId} className={`highlight-keyword-${questionDetails.id} highlight-header scroll-m-150`}>{text}</span>,
    ];
  }
  return [text];
}

function WithGlossary({
  text,
  definitions,
  headerId,
}: {
  text: string[];
  definitions?: Definition[];
  headerId?: string;
}): React.JSX.Element {

  let elements: (React.JSX.Element | string)[] = text;

  if (headerId) {
    questionKeys.forEach((key: string) => {
      if (!questionsList[key].headerId) return elements;
      elements = elements
        .map((element) => {
          if (typeof element !== "string") return element;
          return withHeaderAnchor(element, headerId, questionsList[key]);
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

    if (definitions) {
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
  }

  return (
    <>
      {elements.map((element, i) => (
        <Fragment key={i}>{element}</Fragment>
      ))}
    </>
  );
}

export default WithGlossary;
