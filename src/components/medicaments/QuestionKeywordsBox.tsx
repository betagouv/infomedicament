"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes, useEffect, useState } from "react";
import styled from 'styled-components';
import { questionsList } from "@/data/pages/notices_anchors";
import Button from "@codegouvfr/react-dsfr/Button";
import { QuestionAnchors } from "@/types/NoticesAnchors";

const Container = styled.div `
  position: sticky;
  top: 8px;
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  background-color: var(--background-alt-blue-france);
  z-index: 5;
  filter: drop-shadow(var(--raised-shadow));
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

interface QuestionKeywordsBoxProps extends HTMLAttributes<HTMLDivElement> {
  questionID: string;
  onClose: () => void;
}

interface currentNodeFormat {
  index: number;
  excerpt: string;
  element: Element;
}

function QuestionKeywordsBox(
  {questionID, onClose, ...props}: QuestionKeywordsBoxProps
) {

  const question: QuestionAnchors = questionsList[questionID];

  const [nodeList, setNodeList] = useState<HTMLCollectionOf<Element> | HTMLElement[]>();
  const [currentNode, setCurrentNode] = useState<currentNodeFormat>();

  const getExcerpt = (element: Element) => {
    if(!element) return "";
    const excerpt = element.getElementsByClassName("hidden-excerpt");
    if(excerpt && excerpt[0]){
      return excerpt[0].innerHTML;
    } else {
      return element.innerHTML;
    }
  };

  const updateCurrentNode = (index: number) => {
    if(nodeList){
      const element: Element = nodeList[index];
      currentNode && currentNode.element && currentNode.element.classList && currentNode.element.classList.remove("active");
      setCurrentNode({index: index, excerpt: getExcerpt(element), element: element});
      if(element) {
        element.scrollIntoView({block: 'start'});
        element.classList.add("active");
      }
    }
  }

  useEffect(() => {
    if(question){
      let nodes;
      if(question.keywords) {
        nodes = document.getElementsByClassName(`highlight-keyword-${question.id}`);
      } else if(question.anchors) {
        question.anchors.find((anchor) => {
          const node = document.getElementById(anchor.id);
          if(node){
            nodes = [node];
            return true;
          }
        })
      }
      setNodeList(nodes);
      if(nodes && nodes.length > 0){
        updateCurrentNode(0);
      }
    }
  }, [question]);

  const onClickPrevious = () => {
    let newIndex = 0;
    if(nodeList && currentNode){
      if(currentNode.index > 0){
        newIndex = currentNode.index - 1;
      } else {
        newIndex = nodeList.length -1;
      }
    }
    updateCurrentNode(newIndex);
  };
  const onClickNext = () => {
    let newIndex = 0;
    if(nodeList && currentNode){
      if(currentNode.index < (nodeList.length -1)){
        newIndex = currentNode.index + 1;
      }
    }
    updateCurrentNode(newIndex);
  };

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
          {question.keywords
           ? (
            <>
              <KeywordText>
                (...)&nbsp;{currentNode.excerpt}&nbsp;(...)
              </KeywordText>
              <div style={{verticalAlign: "middle"}}>
                <Button
                  iconId="fr-icon-arrow-left-s-line"
                  onClick={onClickPrevious}
                  priority="tertiary no outline"
                  title="Précédent"
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
                  size="small"
                  style={{verticalAlign: "middle"}}
                />
              </div>
            </>
           ) :(
            <>
              <KeywordText>{currentNode.element.innerHTML}</KeywordText>
            </>
           )}
        </InlineContainer>
      </Container>
    ) : ('')
  );
};

export default QuestionKeywordsBox;
