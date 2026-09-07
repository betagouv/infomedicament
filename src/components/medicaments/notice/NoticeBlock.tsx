"use client";

import { HTMLAttributes } from "react";
import styled from 'styled-components';
import { fr } from "@codegouvfr/react-dsfr";
import ContentContainer from "@/components/generic/ContentContainer";
import DocumentHtml from "../DocumentHtml";
import { NoticeData } from "@/types/SpecialiteTypes";
import { DetailedSpecialite } from "@/types/SpecialiteTypes";
import { Definition } from "@/types/GlossaireTypes";
import { isCentralisee } from "@/utils/specialites";
import CentraliseBlock from "../blocks/CentraliseBlock";

const NoticeBlockContainer = styled.div`
  .notice-highlight {
    background-color: var(--green-tilleul-verveine-950-100);
    border-radius: 2px;
  }
  .notice-highlight-quote {
    background-color: var(--yellow-tournesol-950-100);
    border-radius: 2px;
  }
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
      {...props}
      className={[props.className, fr.cx("fr-mt-3w")].join(" ")}
    >
      <ContentContainer id="noticeContainer">
        {notice ? (
          <DocumentHtml contentHtml={notice.contentHtml} definitions={definitions} />
        ) : (specialite && isCentralisee(specialite)) ? (
          <CentraliseBlock
            pdfURL={specialite.urlCentralise ? specialite.urlCentralise : undefined}
          />
        ) : null}
      </ContentContainer>
    </NoticeBlockContainer>
  );
};

export default NoticeBlock;
