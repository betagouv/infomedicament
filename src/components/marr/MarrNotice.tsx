import { HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { MarrPdf } from "@/types/MarrTypes";
import MarrResumeList from "./MarrResumeList";
import Link from "next/link";

interface MarrNoticeProps extends HTMLAttributes<HTMLDivElement> {
  marr: MarrPdf[];
  onGoToAdvanced: (ancre: string) => void;
}

function MarrNotice({
  marr,
  onGoToAdvanced,
}: MarrNoticeProps) {

  return (
    marr.length > 0 && (
      <>
        <div className={fr.cx("fr-h6", "fr-mb-1w")}>
          Mesure additionnelles de réduction du risque (MARR)
        </div>
        <div className={fr.cx("fr-text--md", "fr-mb-1w")}>
          Consultez les documents ci-dessous pour bien utiliser ce médicament&nbsp;:
        </div>
        <MarrResumeList marr={marr} />
        <div>
          <Link 
            className={fr.cx("fr-icon-arrow-right-line", "fr-link--icon-left", "fr-text--sm")} 
            href="https://ansm.sante.fr"
            target="_blank"
          >
            En savoir plus sur le site de l'ANSM
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
