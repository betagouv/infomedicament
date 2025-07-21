import { HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import Link from "next/link";
import MarrResumeList from "./MarrResumeList";
import { Marr } from "@/types/MarrTypes";

interface MarrNoticeAdvancedProps extends HTMLAttributes<HTMLDivElement> {
  marr: Marr;
}

function MarrNoticeAdvanced({
  marr,
}: MarrNoticeAdvancedProps) {

  return (
    marr.pdf.length > 0 && (
      <>
        <h2 className={fr.cx("fr-h6", "fr-mb-1w")}>
          Mesures additionnelles de réduction du risque (MARR)
        </h2>
        <div className={fr.cx("fr-mb-1w")}>
          Voici l&apos;ensemble des documents de mesure additionnelle de réduction du risque mis à disposition par le(s) laboratoire(s) exploitant(s) ce médicament et validés par l&apos;ANSM :
        </div>
        <div className={fr.cx("fr-mb-2w")}>
          <Link 
            className={fr.cx("fr-icon-arrow-right-line", "fr-link--icon-left", "fr-text--sm")} 
            href={marr.ansmUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            En savoir plus sur le site de l&apos;ANSM
          </Link>
        </div>
        <MarrResumeList marr={marr} inLine/>
      </>
    )
  );
};

export default MarrNoticeAdvanced;
