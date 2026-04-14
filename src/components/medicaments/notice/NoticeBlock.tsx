"use client";

import { HTMLAttributes } from "react";
import styled, { css } from 'styled-components';
import { questionsList, questionKeys } from "@/data/pages/notices_anchors";
import { QuestionsListFormat } from "@/types/NoticesAnchors";
import { fr } from "@codegouvfr/react-dsfr";
import ContentContainer from "@/components/generic/ContentContainer";
import { RcpNoticeContainer } from "../blocks/GenericBlocks";
import { NoticeData } from "@/types/SpecialiteTypes";
import { DetailedSpecialite } from "@/types/SpecialiteTypes";
import { getContent } from "@/utils/notices/noticesUtils";
import { Definition } from "@/types/GlossaireTypes";
import { isCentralisee } from "@/utils/specialites";
import CentraliseBlock from "../blocks/CentraliseBlock";

const NoticeBlockContainer = styled.div<{ $questionsList: QuestionsListFormat; $questionKeys: string[] }> `
  ${props => props.$questionKeys.map(key => {
  //First time for header
  return props.$questionsList[key].id && (
    css`
      .highlight-${key} .highlight-keyword-${props.$questionsList[key].id} {
        background-color: var(--green-tilleul-verveine-950-100);
      }`
  )
  })};
  ${props => props.$questionKeys.map(key => {
    //Second time for keywords
    if (props.$questionsList[key].keywords) {
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

interface NoticeBlockProps extends HTMLAttributes<HTMLDivElement> {
  notice?: NoticeData,
  specialite?: DetailedSpecialite,
  definitions?: Definition[],
}

function NoticeBlock({
  notice,
  specialite,
  definitions,
  ...props
}: NoticeBlockProps) {

  return (
    <NoticeBlockContainer 
      $questionsList={questionsList} 
      $questionKeys={questionKeys} 
      {...props}
      className={[props.className, fr.cx("fr-mt-3w")].join(" ")}
    >
      <ContentContainer id="noticeContainer">
        {(specialite && isCentralisee(specialite)) ? (
          <CentraliseBlock
            pdfURL={specialite.urlCentralise ? specialite.urlCentralise : undefined}
          />
        ) : (notice && notice.children) && (
          <RcpNoticeContainer>{getContent(notice.children, definitions)}</RcpNoticeContainer>
        )}
      </ContentContainer>
    </NoticeBlockContainer>
  );
};

export default NoticeBlock;
