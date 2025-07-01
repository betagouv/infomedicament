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
  max-width: 80%;
  @media (max-width: 48em) {
    max-width: 60%;
  }
`;

interface QuestionKeywordsBoxProps extends HTMLAttributes<HTMLDivElement> {
  questionID: string;
  onClose: () => void;
}

interface currentNodeFormat {
  index: number;
  excerpt: string;
  element?: HTMLElement;
  isHeader: boolean;
}

function QuestionKeywordsBox(
  {questionID, onClose, ...props}: QuestionKeywordsBoxProps
) {

  const question: QuestionAnchors = questionsList[questionID];

  const [nodeList, setNodeList] = useState<HTMLCollectionOf<Element> | HTMLElement[]>();
  const [currentNode, setCurrentNode] = useState<currentNodeFormat>();

  function getExcerptBeforeWords(words: string) : string {
    const split: string[] = words.trim().split(" ");
    const excerpt: string[] = split.slice(split.length >= 3 ? -3 : -split.length);
    return excerpt.join(" ");
  }
  function getExcerptAfterWords(words: string) : string {
    const split: string[] = words.trim().split(" ");
    const excerpt: string[] = split.slice(0, split.length >= 3 ? 3 : split.length);
    return excerpt.join(" ");
  }

  const getExcerpt = (isHeader: boolean, element?: HTMLElement) => {
    if(!element) return "";

    if(isHeader) return element.innerHTML;

    //Excerpt before
    let before = element.previousSibling;
    let beforeText = "";
    if(before){
      beforeText = before.textContent ? before.textContent : "";
      while(before.previousSibling){
        before = before.previousSibling;
        beforeText = (before.textContent ? before.textContent : "") + beforeText;
      }
      beforeText = getExcerptBeforeWords(beforeText);
    }
    //Excerpt After
    let after = element.nextSibling;
    let afterText = "";
    if(after){
      afterText = after.textContent ? after.textContent : "";
      while(after.nextSibling){
        after = after.nextSibling;
        afterText += (after.textContent ? after.textContent : "");
      }
      afterText = getExcerptAfterWords(afterText);
    }
    return beforeText + " " + element.innerHTML + " " + afterText;
  };

  const updateCurrentNode = (index: number, element?: HTMLElement) => {
    if(element){
      currentNode && currentNode.element && currentNode.element.classList && currentNode.element.classList.remove("active");
      const nodeIsHeader = element.className.indexOf("highlight-header") !== -1 ? true : false ;
      setCurrentNode({index: index, excerpt: getExcerpt(nodeIsHeader, element), element: element, isHeader: nodeIsHeader});
      if(element) { 
        element.classList.add("active");
        element.scrollIntoView({block: 'start'});
      }
    } else {
      setCurrentNode({index: index, excerpt: "", element: undefined, isHeader: false});
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
  }, [question, setNodeList, updateCurrentNode]);

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
        <div className={fr.cx("fr-p-1w", "fr-mb-1w")}>
          <InlineContainer className={fr.cx("fr-mb-1w")}>
            <QuestionText>{question.question}</QuestionText>
            <Button
                iconId="fr-icon-close-line"
                onClick={() => onClose()}
                priority="tertiary no outline"
                title="Fermer"
              />
          </InlineContainer>
          {currentNode.element ? (
            <InlineContainer>
              <KeywordText>
                {!currentNode.isHeader && <>(...)&nbsp;</>}
                {currentNode.excerpt}
                {!currentNode.isHeader && <>&nbsp;(...)</>}
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
            </InlineContainer>
          ) : (
            <InlineContainer>
              <KeywordText>
                Aucun résultat
              </KeywordText>
            </InlineContainer>
          )}
        </div>
      </Container>
    ) : ('')
  );
};

export default QuestionKeywordsBox;
