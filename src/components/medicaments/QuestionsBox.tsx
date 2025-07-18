"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes } from "react";
import styled, { css } from 'styled-components';
import { questionsList, questionKeys } from "@/data/pages/notices_anchors";
import { QuestionAnchors } from "@/types/NoticesAnchors";

const Container = styled.div<{ $noBorder?: boolean; }> `
  ${props => !props.$noBorder && css`
    border: var(--border-open-blue-france) 1px solid;
    border-radius: 8px;
    margin-bottom: 1rem;
  `} 
`;

const QuestionLink = styled.span `
  .fr-link {
    white-space: nowrap;
    line-height: 2rem;
    cursor: pointer;
    background-image: var(--underline-img), var(--underline-img);
    background-position: var(--underline-x) 100%, var(--underline-x) calc(100% - var(--underline-thickness));
    background-repeat: no-repeat, no-repeat;
    transition: background-size 0s;
    background-size: var(--underline-hover-width) calc(var(--underline-thickness) * 2), var(--underline-idle-width) var(--underline-thickness);
  }
  .fr-link:hover {
    --underline-hover-width: var(--underline-max-width);
    background-color: var(--hover-tint);
  }
  .fr-link.active span{
    background: rgb(0 0 0 / 8%);
  }
  @media (max-width: 48em) {
    display: block;

    .fr-link {
      white-space: normal;
    }
  }
`;
interface QuestionsBoxProps extends HTMLAttributes<HTMLDivElement> {
  currentQuestion: string | undefined;
  updateCurrentQuestion: (question: string) => void;
  noBorder?: boolean;
}

function QuestionsBox({
  currentQuestion,
  updateCurrentQuestion,
  noBorder,
  ...props
}: QuestionsBoxProps) {

  const onClick = (anchorData: QuestionAnchors) => {
    const noticeContainer = document.getElementById('noticeContainer');
    if(noticeContainer){
      noticeContainer.className = "highlight-" + anchorData.id;
      updateCurrentQuestion(anchorData.id);
    }
  };

  //href on the question is the first element of the anchors list
  return (
    <Container className={fr.cx("fr-p-1w")} $noBorder={noBorder}>
      {questionKeys.map((key: string, index) => (
        <QuestionLink key={index} className={fr.cx("fr-mr-2w", "fr-mb-1w")}>
          <span 
            className={[fr.cx("fr-link", "fr-link--sm"), currentQuestion && currentQuestion === key ? "active" : ""].join(" ")} 
            onClick={() => onClick(questionsList[key])}>
            <span>{questionsList[key].question}</span>
          </span>
        </QuestionLink>
      ))}
    </Container>
  );
};

export default QuestionsBox;
