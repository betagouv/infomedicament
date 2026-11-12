"use client";

import ContentContainer from "../generic/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";
import type { CompositionComponent } from "@/types/SubstanceTypes";
import { HTMLAttributes, useEffect, useRef, useState } from "react";
import styled, { css } from 'styled-components';
import DetailedSubMenu, { AnchorMenu } from "./advanced/DetailedSubMenu";
import { DetailsNoticePartsEnum } from "@/types/NoticeTypes";
import { Marr } from "@/types/MarrTypes";
import { PediatricsInfo } from "@/types/PediatricTypes";
import { DelivranceCondition, DetailedSpecialite } from "@/types/SpecialiteTypes";
import { Presentation } from "@/types/PresentationTypes";
import MedicamentContentHeaderBlock from "./blocks/MedicamentContentHeaderBlock";
import { FicheInfos } from "@/types/FicheInfoTypes";
import { Definition } from "@/types/GlossaireTypes";
import GeneralInformations from "./advanced/GeneralInformations";
import RcpBlock from "./advanced/RcpBlock";
import DocumentHas from "./advanced/DocumentHas";
import { PregnancyAlert } from "@/types/PregancyTypes";
import DesktopTitleBlock from "./blocks/DesktopTitleBlock";
import SwitchNoticeAdvancedBlock from "./blocks/SwitchNoticeAdvancedBlock";
import { displayInfosImportantes } from "@/utils/notices";
import { ShortIndication } from "@/types/IndicationsTypes";
import { AnsmStock } from "@/types/StockTypes";

const AdvancedContentContainer = styled.div`
  @media (max-width: 48em) {
    margin-top: 0rem;
    .fr-mb-4w{
      margin-bottom: 1rem !important;
    }
  }
  @media (min-width: 48em) {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row-reverse;
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
  composants: CompositionComponent[];
  isPrinceps: boolean;
  isGeneric: boolean;
  delivrance: DelivranceCondition[];
  pregnancyPlanAlert: PregnancyAlert | undefined;
  isPregnancyMentionAlert: boolean;
  pediatrics: PediatricsInfo | undefined;
  presentations: Presentation[];
  marr?: Marr;
  ficheInfos?: FicheInfos;
  definitions?: Definition[];
  indications: ShortIndication[];
  indicationsBlock?: string;
  advancedAnchor?: AnchorMenu;
  title: string;
  stocks: AnsmStock[];
  onGoToAdvanced: (advanced: boolean) => void;
}

const defaultNavigation: AnchorMenu = { menuPart: DetailsNoticePartsEnum.INFORMATIONS_GENERALES };

function AdvancedContent({
  atcCode,
  specialite,
  composants,
  isPrinceps,
  isGeneric,
  delivrance,
  pregnancyPlanAlert,
  isPregnancyMentionAlert,
  pediatrics,
  presentations,
  marr,
  ficheInfos,
  definitions,
  indications,
  indicationsBlock,
  advancedAnchor,
  title,
  stocks,
  onGoToAdvanced,
  ...props
}: AdvancedContentProps) {

  const containerRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState({ source: advancedAnchor, navigation: advancedAnchor ?? defaultNavigation });
  const navigation = selection.source === advancedAnchor
    ? selection.navigation
    : advancedAnchor ?? defaultNavigation;
  const currentPart = navigation.menuPart;
  const onNavigate = (navigation: AnchorMenu) => setSelection({ source: advancedAnchor, navigation });
  const setCurrentPart = (menuPart: DetailsNoticePartsEnum) => onNavigate({ menuPart });

  // Scrolling must follow the commit that makes the requested section visible.
  useEffect(() => {
    if (navigation.anchor) {
      const anchor = navigation.anchor;
      const scrollToAnchor = () => {
        const element = document.getElementById(anchor);
        if (!element || !containerRef.current?.contains(element)) return false;
        element.scrollIntoView({ block: "start" });
        return true;
      };
      if (scrollToAnchor() || !containerRef.current) return;
      // RCP HTML can arrive after the section becomes visible.
      const observer = new MutationObserver(() => {
        if (scrollToAnchor()) observer.disconnect();
      });
      observer.observe(containerRef.current, { childList: true, subtree: true });
      return () => observer.disconnect();
    } else {
      window.scrollTo(0, 0);
    }
  }, [navigation]);

  return (
    <AdvancedContentContainer {...props} ref={containerRef} className={["mobile-display-contents", fr.cx("fr-grid-row", "fr-grid-row--gutters")].join(" ",)}>
      <ContentContainer className={["mobile-display-contents", fr.cx("fr-col-12", "fr-col-md-5")].join(" ",)}>
        <DesktopTitleBlock
          title={title}
          isAdvanced={true}
          onGoToAdvanced={onGoToAdvanced}
        />
        <SwitchNoticeAdvancedBlock
          isAdvanced={true}
          onGoToAdvanced={onGoToAdvanced}
          className={fr.cx("fr-mb-2w", "fr-hidden-md")}
        />
        <DetailedSubMenu
          onNavigate={onNavigate}
          navigation={navigation}
          isMarr={(marr && marr.pdf.length > 0)}
          isInfosImportantes={displayInfosImportantes(ficheInfos)}
          isStock={stocks.length > 0}
        />
      </ContentContainer>
      <ContentContainer className={["mobile-display-contents", fr.cx("fr-col-12", "fr-col-md-7")].join(" ",)}>
        <MedicamentContentHeaderBlock
          specialite={specialite}
          ficheInfos={ficheInfos}
          definitions={definitions}
          pregnancyPlanAlert={pregnancyPlanAlert}
          isPregnancyMentionAlert={isPregnancyMentionAlert}
          pediatrics={pediatrics}
        />
        <DetailedNoticeContainer id="informations-generales" $visible={currentPart === DetailsNoticePartsEnum.INFORMATIONS_GENERALES}>
          <GeneralInformations 
            specialite={specialite}
            atcCode={atcCode}
            composants={composants}
            isPrinceps={isPrinceps}
            isPregnancyPlanAlert={!!pregnancyPlanAlert}
            isPregnancyMentionAlert={isPregnancyMentionAlert}
            pediatrics={pediatrics}
            presentations={presentations}
            updateVisiblePart={setCurrentPart}
            marr={marr}
            ficheInfos={ficheInfos}
            delivrance={delivrance}
            definitions={definitions}
            indications={indications}
            indicationsBlock={indicationsBlock}
            stocks={stocks}
          />
        </DetailedNoticeContainer>
        <DetailedNoticeContainer id="rcp-denomiation" $visible={currentPart === DetailsNoticePartsEnum.RCP}>
          <ContentContainer whiteContainer className={fr.cx("fr-mb-2w", "fr-p-2w")}>
            <RcpBlock specialite={specialite} />
          </ContentContainer>
        </DetailedNoticeContainer>
        <DetailedNoticeContainer id="document-has" $visible={currentPart === DetailsNoticePartsEnum.HAS}>
          <DocumentHas 
            ficheInfos={ficheInfos}
            genericSpecialite={specialite}
            isGeneric={isGeneric}
            definitions={definitions}
          />
        </DetailedNoticeContainer>
      </ContentContainer>
    </AdvancedContentContainer>
  );
};

export default AdvancedContent;
