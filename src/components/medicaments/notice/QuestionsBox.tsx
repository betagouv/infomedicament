"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes } from "react";
import styled from 'styled-components';
import { questionsList, questionKeys } from "@/data/pages/notices_anchors";
import { QuestionAnchors } from "@/types/NoticesAnchors";
import { trackEvent } from "@/services/tracking";
import Image from "next/image";

const QuestionsBoxContainer = styled.div`
  display: inline-flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  @media (max-width: 48em) {
    width: 100%;
    > div:last-child {
      padding-right: 10px;
      width: 110px !important;
      min-width: 110px !important;
    }
  }
`;

const QuestionLink = styled.div `
  width: 100px;
  min-width: 100px;
  text-align: center;
  .fr-link {    
    white-space: break-spaces;
    line-height: 1.3rem;
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
    .fr-link {
      white-space: normal;
    }
  }
`;
interface QuestionsBoxProps extends HTMLAttributes<HTMLDivElement> {
  currentQuestion: string | undefined;
  updateCurrentQuestion: (question: string) => void;
}

function QuestionsBox({
  currentQuestion,
  updateCurrentQuestion,
  ...props
}: QuestionsBoxProps) {

  const onClick = (anchorData: QuestionAnchors) => {
    const noticeContainer = document.getElementById('noticeContainer');
    if(noticeContainer){
      noticeContainer.className = "highlight-" + anchorData.id;
      updateCurrentQuestion(anchorData.id);
    }
    trackEvent("Boîte questions", anchorData.tracking);
  };

  //href on the question is the first element of the anchors list
  return (
    <QuestionsBoxContainer {...props} className={[props.className, fr.cx("fr-p-1w")].join(" ")}>
      {questionKeys.map((key: string, index) => (
        <QuestionLink key={index} className={fr.cx("fr-mr-2w", "fr-mb-1w")}>
          <Image
            src={`/icons/${questionsList[key].icon}`}
            alt={`Icone ${questionsList[key].id}`}
            width={36}
            height={36}
          />
          <br/>
          <span 
            className={[fr.cx("fr-link", "fr-link--sm"), currentQuestion && currentQuestion === key ? "active" : ""].join(" ")} 
            onClick={() => onClick(questionsList[key])}>
            <span>{questionsList[key].question}</span>
          </span>
        </QuestionLink>
      ))}
    </QuestionsBoxContainer>
  );
};

export default QuestionsBox;
