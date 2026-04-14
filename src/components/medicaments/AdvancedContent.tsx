"use client";

import ContentContainer from "../generic/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";
import { SpecComposant, SpecDelivrance, SubstanceNom } from "@/db/pdbmMySQL/types";
import { HTMLAttributes, useState } from "react";
import styled, { css } from 'styled-components';
import DetailedSubMenu, { AnchorMenu } from "./advanced/DetailedSubMenu";
import { DetailsNoticePartsEnum } from "@/types/NoticeTypes";
import { Marr } from "@/types/MarrTypes";
import { NoticeRCPContentBlock } from "@/types/SpecialiteTypes";
import { displayInfosImportantes } from "@/utils/notices/noticesUtils";
import { PediatricsInfo } from "@/types/PediatricTypes";
import { DetailedSpecialite } from "@/types/SpecialiteTypes";
import { Presentation } from "@/types/PresentationTypes";
import MedicamentContentHeaderBlock from "./blocks/MedicamentContentHeaderBlock";
import { FicheInfos } from "@/types/FicheInfoTypes";
import { Definition } from "@/types/GlossaireTypes";
import GeneralInformations from "./advanced/GeneralInformations";
import RcpBlock from "./advanced/RcpBlock";
import DocumentHas from "./advanced/DocumentHas";
import SwitchNoticeAdvancedBlock from "./blocks/SwitchNoticeAdvancedBlock";

const AdvancedContentContainer = styled.div`
  @media (max-width: 48em) {
    margin-top: 0rem;
    .fr-mb-4w{
      margin-bottom: 1rem !important;
    }
  }
`;

const DetailedNoticeContainer = styled.div<{ $visible: boolean; }> `
  ${props => !props.$visible && css`
    display: none;
  `}
`;

interface AdvancedContentProps extends HTMLAttributes<HTMLDivElement> {
  atcCode?: string;
  specialite?: DetailedSpecialite;
  composants: Array<SpecComposant & SubstanceNom>;
  isPrinceps: boolean;
  delivrance: SpecDelivrance[];
  isPregnancyPlanAlert: boolean;
  isPregnancyMentionAlert: boolean;
  pediatrics: PediatricsInfo | undefined;
  presentations: Presentation[];
  marr?: Marr;
  ficheInfos?: FicheInfos;
  definitions?: Definition[];
  indicationBlock?: NoticeRCPContentBlock;
  advancedAnchor?: AnchorMenu;
  onGoToAdvanced: (advanced: boolean) => void;
}

function AdvancedContent({
  atcCode,
  specialite,
  composants,
  isPrinceps,
  delivrance,
  isPregnancyPlanAlert,
  isPregnancyMentionAlert,
  pediatrics,
  presentations,
  marr,
  ficheInfos,
  definitions,
  indicationBlock,
  advancedAnchor,
  onGoToAdvanced,
  ...props
}: AdvancedContentProps) {

  const [currentPart, setCurrentPart] = useState<DetailsNoticePartsEnum>(DetailsNoticePartsEnum.INFORMATIONS_GENERALES);

  return (
    <AdvancedContentContainer {...props} className={["mobile-display-contents", fr.cx("fr-grid-row", "fr-grid-row--gutters")].join(" ",)}>
      <ContentContainer className={["mobile-display-contents", fr.cx("fr-col-12", "fr-col-lg-4", "fr-col-md-3")].join(" ",)}>
        <SwitchNoticeAdvancedBlock
          isAdvanced={true}
          onGoToAdvanced={onGoToAdvanced}
        />
        <DetailedSubMenu
          updateVisiblePart={setCurrentPart}
          isMarr={(marr && marr.pdf.length > 0)}
          isInfosImportantes={displayInfosImportantes(ficheInfos)}
          anchor={advancedAnchor}
        />
      </ContentContainer>
      <ContentContainer className={["mobile-display-contents", fr.cx("fr-col-12", "fr-col-lg-8", "fr-col-md-9")].join(" ",)}>
        <MedicamentContentHeaderBlock
          specialite={specialite}
          ficheInfos={ficheInfos}
          definitions={definitions}
        />
        <DetailedNoticeContainer id="informations-generales" $visible={currentPart === DetailsNoticePartsEnum.INFORMATIONS_GENERALES}>
          <GeneralInformations 
            specialite={specialite}
            atcCode={atcCode}
            composants={composants}
            isPrinceps={isPrinceps}
            isPregnancyPlanAlert={isPregnancyPlanAlert}
            isPregnancyMentionAlert={isPregnancyMentionAlert}
            pediatrics={pediatrics}
            presentations={presentations}
            updateVisiblePart={setCurrentPart}
            marr={marr}
            ficheInfos={ficheInfos}
            indicationBlock={indicationBlock}
            delivrance={delivrance}
            definitions={definitions}
          />
        </DetailedNoticeContainer>
        <DetailedNoticeContainer id="rcp-denomiation" $visible={currentPart === DetailsNoticePartsEnum.RCP}>
          <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
            <RcpBlock specialite={specialite} />
          </ContentContainer>
        </DetailedNoticeContainer>
        <DetailedNoticeContainer id="document-has" $visible={currentPart === DetailsNoticePartsEnum.HAS}>
          <DocumentHas 
            ficheInfos={ficheInfos}
            definitions={definitions}
          />
        </DetailedNoticeContainer>
      </ContentContainer>
    </AdvancedContentContainer>
  );
};

export default AdvancedContent;
