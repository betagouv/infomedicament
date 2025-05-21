"use client";

import { HTMLAttributes, PropsWithChildren } from "react";
import styled, { css } from 'styled-components';
import { questionsList, questionKeys } from "@/data/pages/notices_anchors";
import { QuestionsListFormat } from "@/types/NoticesAnchors";

const Container = styled.div<{ $questionsList: QuestionsListFormat; $questionKeys: string[]}> `
  ${props => props.$questionKeys.map(key => { 
    //First time for header
    return props.$questionsList[key].anchors && props.$questionsList[key].anchors.map((anchor) => {
      return css`
      .highlight-${key} .highlight-keyword-${anchor.id} {
        background-color: var(--green-tilleul-verveine-950-100);
      }`;
    })
  })};
  ${props => props.$questionKeys.map(key => { 
    //Second time for keywords
    if(props.$questionsList[key].keywords){
      return css`
      .highlight-${key} .highlight-keyword-${key} {
        background-color: var(--green-tilleul-verveine-950-100);
      }
      .highlight-${key} .highlight-keyword-${key}.active{
        background-color: orange;
      }`;
    }
  })};
`;

interface LeafletContainerProps extends HTMLAttributes<HTMLDivElement> {
}

function LeafletContainer(
  {children, ...props}: PropsWithChildren<LeafletContainerProps>
) {
  return (
    <Container $questionsList={questionsList} $questionKeys={questionKeys} {...props}>
      {children}
    </Container>
  );
};

export default LeafletContainer;
