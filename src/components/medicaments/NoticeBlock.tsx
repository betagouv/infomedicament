"use client";

import ContentContainer from "../generic/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes, PropsWithChildren, useState, useEffect } from "react";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { Notice } from "@/types/MedicamentTypes";
import useSWR from "swr";
import { Definition } from "@/types/GlossaireTypes";
import { fetchJSON } from "@/utils/network";
import { getContent } from "@/utils/notices/noticesUtils";
import { RcpNoticeContainer } from "./Blocks/GenericBlocks";
import GoTopButton from "../generic/GoTopButton";
import styled from 'styled-components';
import QuestionsBox from "./QuestionsBox";


interface NoticeProps extends HTMLAttributes<HTMLDivElement> {
  notice?: Notice;
}

function NoticeBlock({
  notice,
  ...props
}: PropsWithChildren<NoticeProps>) {


  



  return (
              // <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-4w")}>
             
              
              //   {showKeywordsBox && currentQuestion && (
              //     <QuestionKeywordsBox
              //       className={fr.cx("fr-hidden", "fr-unhidden-md")}
              //       onClose={() => onCloseQuestionKeywordsBox()}
              //       questionID={currentQuestion}/>
              //   )}
              //   <LeafletContainer className={fr.cx("fr-mt-3w")}>
              //     <ContentContainer id="leafletContainer">
              //       {leaflet}
              //     </ContentContainer>
              //   </LeafletContainer>
              // </ContentContainer>
            



    <ContentContainer className={["mobile-display-contents", fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-9")].join(" ",)}>

    </ContentContainer>
  );
};

export default NoticeBlock;
