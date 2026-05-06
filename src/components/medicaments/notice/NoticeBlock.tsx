"use client";

import { HTMLAttributes } from "react";
import styled from 'styled-components';
import { fr } from "@codegouvfr/react-dsfr";
import ContentContainer from "@/components/generic/ContentContainer";
import { RcpNoticeContainer } from "../blocks/GenericBlocks";
import { NoticeData } from "@/types/SpecialiteTypes";
import { DetailedSpecialite } from "@/types/SpecialiteTypes";
import { getContent } from "@/utils/notices/noticesUtils";
import { Definition } from "@/types/GlossaireTypes";
import { isCentralisee } from "@/utils/specialites";
import CentraliseBlock from "../blocks/CentraliseBlock";

const NoticeBlockContainer = styled.div``;

interface NoticeBlockProps extends HTMLAttributes<HTMLDivElement> {
  notice?: NoticeData,
  specialite?: DetailedSpecialite,
  definitions?: Definition[],
  noticeContainerClassName?: string,
}

function NoticeBlock({
  notice,
  specialite,
  definitions,
  noticeContainerClassName,
  ...props
}: NoticeBlockProps) {

  return (
    <NoticeBlockContainer
      {...props}
      className={[props.className, fr.cx("fr-mt-3w")].join(" ")}
    >
      <ContentContainer className={noticeContainerClassName} id="noticeContainer">
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
