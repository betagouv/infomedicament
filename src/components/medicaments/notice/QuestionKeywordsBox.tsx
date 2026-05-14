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

const KeywordText = styled.span `
  max-width: 60%;
  width: 60%;
`;

interface QuestionKeywordsBoxProps extends HTMLAttributes<HTMLDivElement> {
  questionID: string;
  onClose: () => void;
}

interface currentNodeFormat {
  index: number;
  element?: HTMLElement;
  isHeader: boolean;
}

function QuestionKeywordsBox(
  {questionID, onClose, ...props}: QuestionKeywordsBoxProps
) {

  const question: QuestionAnchors = questionsList[questionID];

  const [nodeList, setNodeList] = useState<HTMLCollectionOf<Element> | HTMLElement[]>();
  const [currentNode, setCurrentNode] = useState<currentNodeFormat>();

  const updateCurrentNode = (index: number, element?: HTMLElement) => {
    if(element){
      currentNode && currentNode.element && currentNode.element.classList && currentNode.element.classList.remove("active");
      const nodeIsHeader = element.className.indexOf("highlight-header") !== -1 ? true : false ;
      setCurrentNode({index: index, element: element, isHeader: nodeIsHeader});
      if(element) { 
        element.classList.add("active");
        element.scrollIntoView({block: 'start'});
      }
    } else {
      setCurrentNode({index: index, element: undefined, isHeader: false});
    }
  };

  useEffect(() => {
    if(question){
      const nodes = document.getElementsByClassName(`highlight-keyword-${question.id}`);
      setNodeList(nodes);
      updateCurrentNode(
        0, 
        nodes && nodes.length > 0 ? nodes[0] as HTMLElement : undefined
      );
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
    updateCurrentNode(
      newIndex, 
      nodeList && nodeList[newIndex] ? nodeList[newIndex] as HTMLElement : undefined
    );
  };
  const onClickNext = () => {
    let newIndex = 0;
    if(nodeList && currentNode){
      if(currentNode.index < (nodeList.length -1)){
        newIndex = currentNode.index + 1;
      }
    }
    updateCurrentNode(
      newIndex, 
      nodeList && nodeList[newIndex] ? nodeList[newIndex] as HTMLElement : undefined
    );
  };

  return (
    question && nodeList && currentNode ? (
      <Container className={props.className} {...props}>
        <div className={fr.cx("fr-p-1w")}>
          <InlineContainer>
            <KeywordText>
              Naviguez dans les réponses : 
            </KeywordText>
            {currentNode.element ? (
              <div style={{verticalAlign: "middle"}}>
                <Button
                  iconId="fr-icon-arrow-left-s-line"
                  onClick={onClickPrevious}
                  priority="tertiary no outline"
                  title="Précédent"
                  size="small"
                  style={{verticalAlign: "middle"}}
                />
                <span className={fr.cx("fr-p-1w", "fr-mb-3w")} style={{verticalAlign: "middle"}}>
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
            ) : (
              <KeywordText>
                Aucun résultat
              </KeywordText>
            )}
            <Button
                iconId="fr-icon-close-line"
                onClick={() => onClose()}
                priority="tertiary no outline"
                title="Fermer"
              />
          </InlineContainer>
        </div>
      </Container>
    ) : ('')
  );
};

export default QuestionKeywordsBox;
