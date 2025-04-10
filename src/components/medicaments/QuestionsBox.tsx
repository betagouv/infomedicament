"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Link from "next/link";
import { HTMLAttributes, useState } from "react";
import styled from 'styled-components';
import { questionsList, questionKeys } from "@/data/pages/notices_anchors";
import { QuestionAnchors } from "@/types/NoticesAnchors";
import KeywordsBox from "./KeywordsBox";

const Container = styled.div `
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  .fr-link {
    white-space: nowrap;
    line-height: 2rem;
  }
  .fr-link.active span{
    background: rgb(0 0 0 / 8%);
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
      anchorData.keywords ? setShowKeywordsBox(true) : setShowKeywordsBox(false);
    }
  };

  //href on the question is the first element of the anchors list
  return (
    <>
      <Container className={fr.cx("fr-p-1w", "fr-mb-2w")} {...props}>
        {questionKeys.map((key: string, index) => (
          <span key={index} className={fr.cx("fr-mr-2w", "fr-mb-1w")}>
            <Link 
              className={[fr.cx("fr-link", "fr-link--sm"), currentQuestion && currentQuestion === key ? "active" : ""].join(" ")} 
              href={(questionsList[key].anchors && questionsList[key].anchors[0]) ? `#${questionsList[key].anchors[0].id}` : ''} 
              onClick={() => onClick(questionsList[key])}>
                <span>{questionsList[key].question}</span>
              </Link>
          </span>
        ))}
      </Container>
      {showKeywordsBox && currentQuestion && (
        <KeywordsBox onClose={() => setShowKeywordsBox(false)} questionID={currentQuestion}/>
      )}
    </>
  );
};

export default QuestionsBox;
