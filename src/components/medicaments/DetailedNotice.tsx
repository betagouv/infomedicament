"use client";

import { DetailsNoticePartsEnum } from "@/types/NoticeTypes";
import ContentContainer from "../generic/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes, useEffect, useState } from "react";
import styled, { css } from 'styled-components';
import GeneralInformations from "./detailed/GeneralInformations";
import { Presentation, PresInfoTarif, SpecComposant, SubstanceNom } from "@/db/pdbmMySQL/types";
import { PresentationDetail } from "@/db/types";
import { Nullable } from "kysely";
import DocumentHas from "./detailed/DocumentHas";
import { Marr } from "@/types/MarrTypes";
import { FicheInfos, NoticeRCPContentBlock } from "@/types/MedicamentTypes";
import RcpBlock from "./detailed/RcpBlock";
import { PediatricsInfo } from "@/types/PediatricTypes";
import { DetailedSpecialite } from "@/types/SpecialiteTypes";

const DetailedNoticeContainer = styled.div<{ $visible: boolean; }> `
  ${props => !props.$visible && css`
    display: none;
  `}
`;

interface DetailedNoticeProps extends HTMLAttributes<HTMLDivElement> {
  currentVisiblePart: DetailsNoticePartsEnum;
  atcCode?: string;
  specialite?: DetailedSpecialite;
  composants: Array<SpecComposant & SubstanceNom>;
  isPrinceps: boolean;
  isPregnancyPlanAlert: boolean;
  isPregnancyMentionAlert: boolean;
  pediatrics: PediatricsInfo | undefined;
  presentations: (Presentation & Nullable<PresInfoTarif> & { details?: PresentationDetail })[];
  marr?: Marr;
  ficheInfos?: FicheInfos
  indicationBlock?: NoticeRCPContentBlock;
}

function DetailedNotice({
  currentVisiblePart, 
  atcCode,
  specialite,
  composants,
  isPrinceps,
  isPregnancyPlanAlert,
  isPregnancyMentionAlert,
  pediatrics,
  presentations,
  marr,
  onResetCapture,
  ficheInfos,
  indicationBlock,
  ...props 
}: DetailedNoticeProps) {

  const [currentSpec, setCurrentSpec] = useState<DetailedSpecialite>();
  const [visiblePart, setVisiblePart] = useState<DetailsNoticePartsEnum>(currentVisiblePart);
  const [currentIndicationBlock, setCurrentIndicationBlock] = useState<NoticeRCPContentBlock>();

  useEffect(() => {
    setVisiblePart(currentVisiblePart);
  }, [currentVisiblePart, setVisiblePart]);

  useEffect(() => {
    setCurrentIndicationBlock(indicationBlock);
  }, [indicationBlock, setCurrentIndicationBlock]);

  useEffect(() => {
    setCurrentSpec(specialite);
  }, [specialite, setCurrentSpec]);

  return (
    <>
      <DetailedNoticeContainer id="informations-generales" $visible={visiblePart === DetailsNoticePartsEnum.INFORMATIONS_GENERALES}>
        <GeneralInformations 
          CIS={currentSpec && currentSpec.SpecId}
          atcCode={atcCode}
          composants={composants}
          isPrinceps={isPrinceps}
          SpecGeneId={currentSpec ? currentSpec.SpecGeneId : ""}
          isPregnancyPlanAlert={isPregnancyPlanAlert}
          isPregnancyMentionAlert={isPregnancyMentionAlert}
          pediatrics={pediatrics}
          presentations={presentations}
          updateVisiblePart={setVisiblePart}
          marr={marr}
          ficheInfos={ficheInfos}
          indicationBlock={currentIndicationBlock}
        />
      </DetailedNoticeContainer>
      <DetailedNoticeContainer id="rcp-denomiation" $visible={visiblePart === DetailsNoticePartsEnum.RCP}>
        <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
          <RcpBlock specialite={currentSpec} />
        </ContentContainer>
      </DetailedNoticeContainer>
      <DetailedNoticeContainer id="document-has-bon-usage" $visible={visiblePart === DetailsNoticePartsEnum.HAS}>
        <DocumentHas ficheInfos={ficheInfos}/>
      </DetailedNoticeContainer>
    </>
  );
};

export default DetailedNotice;
