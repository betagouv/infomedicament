"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes } from "react";
import styled from "styled-components";
import { questionsList, questionKeys } from "@/data/pages/notices_anchors";
import { QuestionAnchors } from "@/types/NoticesAnchors";
import { trackEvent } from "@/services/tracking";
import Image from "next/image";

const QuestionsBoxContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const QuestionsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  column-gap: 0.5rem;
  align-items: start;
  @media (max-width: 48em) {
    width: 100%;
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
  }
`;

const QuestionButton = styled.button`
  cursor: pointer;
  align-self: start;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  padding: 0;
  &:hover {
    text-decoration: underline;
  }
  &:disabled {
    cursor: wait;
  }
  &[aria-pressed="true"] {
    background-color: var(--background-alt-blue-france);
  }
  @media (max-width: 48em) {
    flex-shrink: 0;
    margin-bottom: 0.5rem !important;
  }
`;

const QuestionLink = styled.span`
  display: block;
  text-align: center;
  padding-top: 4px;
  @media (min-width: 48em) {
    margin-right: 0 !important;
  }
  & img {
    width: 50px;
    height: 50px;
  }
  @media (max-width: 48em) {
    & img {
      width: 70px;
      height: 70px;
    }
  }
`;

interface QuestionsBoxProps extends HTMLAttributes<HTMLDivElement> {
  currentQuestion: string | undefined;
  updateCurrentQuestion: (question: string) => void;
  disabled?: boolean;
}

function QuestionsBox({
  currentQuestion,
  updateCurrentQuestion,
  disabled = false,
  ...props
}: QuestionsBoxProps) {
  const onClick = (anchorData: QuestionAnchors) => {
    updateCurrentQuestion(anchorData.id);
    trackEvent("Boîte questions", anchorData.tracking);
  };

  return (
    <QuestionsBoxContainer
      {...props}
      className={[props.className, fr.cx("fr-p-1w")].join(" ")}
    >
      <QuestionsRow>
        {questionKeys.map((key: string, index) => (
          <QuestionButton
            type="button"
            disabled={disabled}
            aria-pressed={currentQuestion === key}
            aria-label={questionsList[key].question}
            key={index}
            onClick={() => onClick(questionsList[key])}
          >
            <QuestionLink
              className={[
                fr.cx("fr-mr-2w", "fr-mb-1w"),
                currentQuestion && currentQuestion === key ? "active" : "",
              ].join(" ")}
            >
              <Image
                src={`/icons/${questionsList[key].icon}`}
                alt={questionsList[key].question}
                width={70}
                height={70}
              />
              <br />
              <span className={fr.cx("fr-link", "fr-link--sm")}>
                {questionsList[key].question}
              </span>
            </QuestionLink>
          </QuestionButton>
        ))}
      </QuestionsRow>
    </QuestionsBoxContainer>
  );
}

export default QuestionsBox;
