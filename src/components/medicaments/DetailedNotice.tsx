"use client";

import { DetailsNoticePartsEnum } from "@/types/NoticeTypes";
import ContentContainer from "../generic/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes, useEffect, useState } from "react";
import styled, { css } from 'styled-components';
import GeneralInformations from "./DetailedNotice/GeneralInformations";
import { Presentation, PresInfoTarif, SpecComposant, SubstanceNom } from "@/db/pdbmMySQL/types";
import { PediatricsInfo } from "@/data/grist/pediatrics";
import { PresentationDetail } from "@/db/types";
import { Nullable } from "kysely";
import DocumentHas from "./DetailedNotice/DocumentHas";
import { Marr } from "@/types/MarrTypes";
import { FicheInfos, NoticeRCPContentBlock, Rcp } from "@/types/MedicamentTypes";
import RcpBlock from "./DetailedNotice/RcpBlock";

const DetailedNoticeContainer = styled.div<{ $visible: boolean; }> `
  ${props => !props.$visible && css`
    display: none;
  `}
`;

interface DetailedNoticeProps extends HTMLAttributes<HTMLDivElement> {
  currentVisiblePart: DetailsNoticePartsEnum;
  CIS: string;
  atcCode?: string;
  composants: Array<SpecComposant & SubstanceNom>;
  isPrinceps: boolean;
  SpecGeneId?: string;
  isPregnancyPlanAlert: boolean;
  isPregnancyMentionAlert: boolean;
  pediatrics: PediatricsInfo | undefined;
  presentations: (Presentation & Nullable<PresInfoTarif> & { details?: PresentationDetail })[];
  marr?: Marr;
  rcp?: Rcp;
  ficheInfos?: FicheInfos
  indicationBlock?: NoticeRCPContentBlock;
}

function DetailedNotice({
  currentVisiblePart, 
  CIS,
  atcCode,
  composants,
  isPrinceps,
  SpecGeneId,
  isPregnancyPlanAlert,
  isPregnancyMentionAlert,
  pediatrics,
  presentations,
  marr,
  onResetCapture,
  rcp,
  ficheInfos,
  indicationBlock,
  ...props 
}: DetailedNoticeProps) {

  const [visiblePart, setVisiblePart] = useState<DetailsNoticePartsEnum>(currentVisiblePart);

  useEffect(() => {
    setVisiblePart(currentVisiblePart);
  }, [currentVisiblePart]);

  return (
    <>
      <DetailedNoticeContainer id="informations-generales" $visible={visiblePart === DetailsNoticePartsEnum.INFORMATIONS_GENERALES}>
        <GeneralInformations 
          CIS={CIS}
          atcCode={atcCode}
          composants={composants}
          isPrinceps={isPrinceps}
          SpecGeneId={SpecGeneId}
          isPregnancyPlanAlert={isPregnancyPlanAlert}
          isPregnancyMentionAlert={isPregnancyMentionAlert}
          pediatrics={pediatrics}
          presentations={presentations}
          updateVisiblePart={setVisiblePart}
          marr={marr}
          ficheInfos={ficheInfos}
          indicationBlock={indicationBlock}
        />
      </DetailedNoticeContainer>
      <DetailedNoticeContainer id="rcp-denomiation" $visible={visiblePart === DetailsNoticePartsEnum.RCP}>
        <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
          <RcpBlock rcp={rcp} />
        </ContentContainer>
      </DetailedNoticeContainer>
      <DetailedNoticeContainer id="document-has-bon-usage" $visible={visiblePart === DetailsNoticePartsEnum.HAS}>
        <DocumentHas ficheInfos={ficheInfos}/>
      </DetailedNoticeContainer>
    </>
  );
};

export default DetailedNotice;
