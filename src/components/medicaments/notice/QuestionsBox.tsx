"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes, useEffect, useState } from "react";
import styled from 'styled-components';
import { questionsList, questionKeys } from "@/data/pages/notices_anchors";
import { QuestionAnchors } from "@/types/NoticesAnchors";
import { trackEvent } from "@/services/tracking";
import Image from "next/image";
import Link from "next/link";

const QuestionsBoxContainer = styled.div`
  gap: 4.1667%;
  @media (max-width: 48em) {
    width: 100%;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    overflow-x: auto;
  }
`;
const QuestionLinkContainer = styled.div `
  cursor: pointer;
  :hover {
    text-decoration: underline;
  }
  .active {
    background-color: var(--background-alt-blue-france);
  }
  @media (max-width: 48em) {
    margin-bottom: 0.5rem !important;
  }
`;
const QuestionLink = styled.div `
  text-align: center;
  padding-top: 4px;
  img{
    width: 50px;
    height: 50px;
    @media (max-width: 48em) {
      width: 70px;
      height: 70px;
    }
  }
`;
const QuestionsViewAllBlock = styled.div`
  width: 100%;
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

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isResizable, setIsResizable] = useState<boolean>(true);

  const onClick = (anchorData: QuestionAnchors) => {
    const noticeContainer = document.getElementById('noticeContainer');
    if(noticeContainer){
      noticeContainer.className = "highlight-" + anchorData.id;
      updateCurrentQuestion(anchorData.id);
    }
    trackEvent("Boîte questions", anchorData.tracking);
  };

  const isVisible = (index: number): boolean => {
    if(!isResizable)
      return true;
    if((!isOpen && index < 10) || isOpen)
      return true;
    return false;
  }

  function updateIsResizable() {
    if (window.innerWidth <= 768) {
      setIsResizable(false);
    } else {
      setIsResizable(true);
    }
  }

  useEffect(() => {
    updateIsResizable();
    window.addEventListener('resize', updateIsResizable);
    return () => {
      window.removeEventListener('resize', updateIsResizable);
    };
  }, []);

  //href on the question is the first element of the anchors list
  return (
    <QuestionsBoxContainer {...props} className={[props.className, fr.cx("fr-grid-row", "fr-p-1w")].join(" ")}>
      {questionKeys.map((key: string, index) => {
        if(isVisible(index)) {
          return (
            <QuestionLinkContainer 
              key={index} 
              className={[fr.cx("fr-mb-2w", "fr-col-3", "fr-col-md-2"), currentQuestion && currentQuestion === key ? "active" : ""].join(" ")}
              onClick={() => onClick(questionsList[key])}
            >
              <QuestionLink
                className={currentQuestion && currentQuestion === key ? "active" : ""}
              >
                <Image
                  src={`/icons/${questionsList[key].icon}`}
                  alt={`Icone ${questionsList[key].id}`}
                  width={70}
                  height={70}
                />
                <br/>
                <span 
                  className={fr.cx("fr-link", "fr-link--sm")} 
                >
                  {questionsList[key].question}
                </span>
              </QuestionLink>
            </QuestionLinkContainer>
          )
        }
      })}
      {isResizable && (
        <QuestionsViewAllBlock
          className={isOpen ? fr.cx("fr-icon-arrow-up-s-line") : fr.cx("fr-icon-arrow-down-s-line")}
        >
          <Link 
            className={fr.cx("fr-link", "fr-text--bold", "fr-text--sm")}
            href=""
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? "Voir moins" : "Voir plus"}
          </Link>
        </QuestionsViewAllBlock>
      )}
    </QuestionsBoxContainer>
  );
};

export default QuestionsBox;
