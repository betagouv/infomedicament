"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes, useEffect, useState } from "react";
import styled from 'styled-components';
import { questionsList } from "@/data/pages/notices_anchors";
import Button from "@codegouvfr/react-dsfr/Button";
import { QuestionAnchors } from "@/types/NoticesAnchors";

const Container = styled.div `
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  background-color: var(--background-alt-blue-france);
`;

const InlineContainer = styled.div `
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const QuestionText = styled.span `
  font-weight: bold;
  font-size: 14px;
`;

const KeywordText = styled.span `
  font-style: italic;
  font-size: 14px;
`;

interface KeywordsBoxProps extends HTMLAttributes<HTMLDivElement> {
  questionID: string;
  onClose: () => void;
}

interface currentNodeFormat {
  index: number;
  element: Element;  
}

function KeywordsBox(
  {questionID, onClose, ...props}: KeywordsBoxProps
) {

  const [question, setQuestion] = useState<QuestionAnchors>();
  const [nodeList, setNodeList] = useState<HTMLCollectionOf<Element>>();
  const [currentNode, setCurrentNode] = useState<currentNodeFormat>();

  const updateCurrentNode = (index: number, element: Element) => {
    currentNode && currentNode.element && currentNode.element.classList && currentNode.element.classList.remove("active");
    setCurrentNode({index: index, element: element});
    if(element) {
      element.scrollIntoView();
      element.classList.add("active");
    }
  }

  useEffect(() => {
    const newQuestion = questionsList[questionID];
    setQuestion(newQuestion);
    if(newQuestion){
      const nodes = document.getElementsByClassName(`highlight-keyword-${newQuestion.id}`);
      if(nodes && nodes.length > 0){
        setNodeList(nodes);
        updateCurrentNode(0, nodes[0]);
      }
    }
  }, [questionID, setQuestion, setNodeList, setCurrentNode]);

  const onClickPrevious = () => {
    if(nodeList && currentNode && currentNode.index > 0){
      updateCurrentNode(currentNode.index - 1, nodeList[currentNode.index - 1]);
    }
  };
  const onClickNext = () => {
    if(nodeList && currentNode && currentNode.index < (nodeList.length -1) ){
      updateCurrentNode(currentNode.index + 1, nodeList[currentNode.index + 1]);
    };
  };

  //TODO innerHTML a changer - il faudrait un extrait
  return (
    question && nodeList && currentNode ? (
      <Container className={fr.cx("fr-p-1w", "fr-mb-1w")} {...props}>
        <InlineContainer className={fr.cx("fr-mb-1w")}>
          <QuestionText>{question.question}</QuestionText>
          <Button
              iconId="fr-icon-close-line"
              onClick={() => onClose()}
              priority="tertiary no outline"
              title="Fermer"
            />
        </InlineContainer>
        <InlineContainer>
          <KeywordText>(...) {currentNode.element.innerHTML} (...)</KeywordText>
          <div style={{verticalAlign: "middle"}}>
            <Button
              iconId="fr-icon-arrow-left-s-line"
              onClick={onClickPrevious}
              priority="tertiary no outline"
              title="Précédent"
              disabled={currentNode.index === 0}
              size="small"
              style={{verticalAlign: "middle"}}
            />
            <span className={fr.cx("fr-p-1w", "fr-mb-3w", "fr-text--sm")} style={{verticalAlign: "middle"}}>
              {currentNode.index + 1} sur {nodeList.length}
            </span>
            <Button
              iconId="fr-icon-arrow-right-s-line"
              onClick={onClickNext}
              priority="tertiary no outline"
              title="Suivant"
              disabled={currentNode.index === (nodeList.length - 1)}
              size="small"
              style={{verticalAlign: "middle"}}
            />
          </div>
        </InlineContainer>
      </Container>
    ) : ('')
  );
};

export default KeywordsBox;
