"use client";

import { HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import MarrResumeList from "./MarrResumeList";
import Link from "next/link";
import { Marr } from "@/types/MarrTypes";
import { AnchorMenu } from "../medicaments/advanced/DetailedSubMenu";
import { DetailsNoticePartsEnum } from "@/types/NoticeTypes";
import styled from "styled-components";

const MarrTitle = styled.h2`
  margin-bottom: 0.5rem;
  @media (max-width: 48em) {
    font-size: 1.5rem !important;
    margin-bottom: 1rem;
  }
`;

interface MarrNoticeProps extends HTMLAttributes<HTMLDivElement> {
  marr: Marr;
  onGoToAdvanced: (anchor: AnchorMenu) => void;
}

function MarrNotice({
  marr,
  onGoToAdvanced,
}: MarrNoticeProps) {

  return (
    marr && marr.pdf.length > 0 && (
      <>
        <MarrTitle className={fr.cx("fr-h6", "fr-mb-1w")}>
          Documents associés
        </MarrTitle>
        <div className={fr.cx("fr-text--sm", "fr-mb-1w")}>
          Mesures additionnelles de réduction du risque (MARR)<br/>
          Consultez les documents ci-dessous pour bien utiliser ce médicament&nbsp;:
        </div>
        <MarrResumeList marr={marr} />
        <div>
          <Link 
            className={fr.cx("fr-icon-arrow-right-line", "fr-link--icon-left", "fr-text--sm")} 
            href={marr.ansmUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            En savoir plus sur le site de l&apos;ANSM
          </Link>
        </div>
        <div>
          <Link 
            className={fr.cx("fr-icon-arrow-right-line", "fr-link--icon-left", "fr-text--sm")} 
            href=""            
            onClick={() => onGoToAdvanced({anchor: "informations-marr", menuPart: DetailsNoticePartsEnum.INFORMATIONS_GENERALES})}
          >
            Voir les documents pour les professionnels de santé
          </Link>
        </div>
      </>
    )
  );
};

export default MarrNotice;
