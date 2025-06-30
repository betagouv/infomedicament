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
import { FicheInfos, Rcp } from "@/types/MedicamentsTypes";
import RcpBlock from "./DetailedNotice/RcpBlock";
import useSWR from "swr";
import { fetchJSON } from "@/utils/network";

const DetailedNoticeContainer = styled.div<{ $visible: boolean; }> `
  ${props => !props.$visible && css`
    display: none;
  `}
`;

interface DetailedNoticeProps extends HTMLAttributes<HTMLDivElement> {
  currentVisiblePart: DetailsNoticePartsEnum;
  CIS: string;
  atcCode: string;
  composants: Array<SpecComposant & SubstanceNom>;
  isPrinceps: boolean;
  SpecGeneId: string;
  isPregnancyAlert: boolean;
  pediatrics: PediatricsInfo | undefined;
  presentations: (Presentation & Nullable<PresInfoTarif> & { details?: PresentationDetail })[];
  marr?: Marr;
  rcp?: Rcp;
}

function DetailedNotice({
  currentVisiblePart, 
  CIS,
  atcCode,
  composants,
  isPrinceps,
  SpecGeneId,
  isPregnancyAlert,
  pediatrics,
  presentations,
  marr,
  onResetCapture,
  rcp,
  ...props 
}: DetailedNoticeProps) {

  const [visiblePart, setVisiblePart] = useState<DetailsNoticePartsEnum>(currentVisiblePart);

  useEffect(() => {
    setVisiblePart(currentVisiblePart);
  }, [currentVisiblePart]);

  const { data: ficheInfos } = useSWR<FicheInfos>(
    `/medicaments/notices/ficheInfos?cis=${CIS}`,
    fetchJSON,
    { onError: (err) => console.warn('errorRCP >>', err), }
  );

  return (
    <ContentContainer className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-9")}>
      <DetailedNoticeContainer id="informations-generales" $visible={visiblePart === DetailsNoticePartsEnum.INFORMATIONS_GENERALES}>
        <GeneralInformations 
          CIS={CIS}
          atcCode={atcCode}
          composants={composants}
          isPrinceps={isPrinceps}
          SpecGeneId={SpecGeneId}
          isPregnancyAlert={isPregnancyAlert}
          pediatrics={pediatrics}
          presentations={presentations}
          updateVisiblePart={setVisiblePart}
          marr={marr}
          ficheInfos={ficheInfos}
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
    </ContentContainer>
  );
};

export default DetailedNotice;
