"use client";

import { HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import MarrResumeList from "./MarrResumeList";
import Link from "next/link";
import { Marr } from "@/types/MarrTypes";

interface MarrNoticeProps extends HTMLAttributes<HTMLDivElement> {
  marr: Marr;
  onGoToAdvanced: (ancre: string) => void;
}

function MarrNotice({
  marr,
  onGoToAdvanced,
}: MarrNoticeProps) {

  return (
    marr.pdf.length > 0 && (
      <>
        <h3 className={fr.cx("fr-h6", "fr-mb-1w")}>
          Mesures additionnelles de réduction du risque (MARR)
        </h3>
        <div className={fr.cx("fr-text--md", "fr-mb-1w")}>
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
            onClick={() => onGoToAdvanced("ancre")}
          >
            Voir les documents pour les professionnels de santé
          </Link>
        </div>
      </>
    )
  );
};

export default MarrNotice;
