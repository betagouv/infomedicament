"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes, useState } from "react";
import styled from 'styled-components';
import { questionsList, questionKeys } from "@/data/pages/notices_anchors";
import { QuestionAnchors } from "@/types/NoticesAnchors";
import QuestionKeywordsBox from "./QuestionKeywordsBox";

const Container = styled.div `
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
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
  @media only screen and (max-width: 768px) {
    display: block;

    .fr-link {
      white-space: normal;
    }
  }
`;
interface QuestionsBoxProps extends HTMLAttributes<HTMLDivElement> {}

function QuestionsBox(
  {...props}: QuestionsBoxProps
) {

  const [currentQuestion, setCurrentQuestion] = useState<string>();
  const [showKeywordsBox, setShowKeywordsBox] = useState<boolean>(false);

  const onClick = (anchorData: QuestionAnchors) => {
    const leafletContainer = document.getElementById('leafletContainer');
    if(leafletContainer){
      leafletContainer.className = "highlight-" + anchorData.id;
      setCurrentQuestion(anchorData.id);
      if(anchorData.keywords) {
        setShowKeywordsBox(true);
      } else {
        setShowKeywordsBox(false);
        if(anchorData.anchors && anchorData.anchors[0]){
          const block = document.getElementById(anchorData.anchors[0].id);
          block && block.scrollIntoView({
            block: 'start',
            inline: 'start',
          });
        }
      }
    }
  };

  //href on the question is the first element of the anchors list
  return (
    <>
      <Container className={fr.cx("fr-p-1w", "fr-mb-2w")} {...props}>
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
      {showKeywordsBox && currentQuestion && (
        <QuestionKeywordsBox onClose={() => setShowKeywordsBox(false)} questionID={currentQuestion}/>
      )}
    </>
  );
};

export default QuestionsBox;
