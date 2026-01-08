"use client";

import * as Sentry from "@sentry/nextjs";
import { HTMLAttributes, useCallback, useEffect, useState } from "react";
import styled, { css } from 'styled-components';
import { questionsList, questionKeys } from "@/data/pages/notices_anchors";
import { QuestionsListFormat } from "@/types/NoticesAnchors";
import { fr } from "@codegouvfr/react-dsfr";
import ContentContainer from "../generic/ContentContainer";
import { RcpNoticeContainer } from "./blocks/GenericBlocks";
import { NoticeData } from "@/types/SpecialiteTypes";
import { DetailedSpecialite } from "@/types/SpecialiteTypes";
import { getContent } from "@/utils/notices/noticesUtils";
import { Definition } from "@/types/GlossaireTypes";
import getGlossaryDefinitions from "@/data/grist/glossary";
import { isCentralisee } from "@/utils/specialites";
import CentraliseBlock from "./blocks/CentraliseBlock";

const Container = styled.div<{ $questionsList: QuestionsListFormat; $questionKeys: string[]}> `
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

interface NoticeBlockProps extends HTMLAttributes<HTMLDivElement> {
  notice?: NoticeData,
  specialite?: DetailedSpecialite,
}

function NoticeBlock({
  notice,
  specialite,
  ...props
}: NoticeBlockProps ) {

  const [definitions, setDefinitions] = useState<Definition[]>();

  const loadDefinitions = useCallback(
    async () => {
      try {
        const newDefinitions = (await getGlossaryDefinitions()).filter(
          (d) => d.fields.A_publier,
        );
        setDefinitions(newDefinitions)
      } catch (e) {
        Sentry.captureException(e);
      }
    }, [setDefinitions]
  );

  useEffect(() => {
    if(notice) {
      loadDefinitions();
    }
  }, [notice, loadDefinitions]);

  return (
    <Container $questionsList={questionsList} $questionKeys={questionKeys} className={fr.cx("fr-mt-3w")}>
      <ContentContainer id="noticeContainer">
        {(specialite && isCentralisee(specialite)) ? (
          <CentraliseBlock
            pdfURL={specialite.UrlEpar ? specialite.UrlEpar : undefined}
          />
        ) : (notice && notice.children) && (
          <RcpNoticeContainer>{getContent(notice.children, definitions)}</RcpNoticeContainer>
        )}
      </ContentContainer>
    </Container>
  );
};

export default NoticeBlock;
