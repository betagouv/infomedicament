import { HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { MarrPdf } from "@/types/MarrTypes";
import Link from "next/link";
import MarrResumeList from "./MarrResumeList";

interface MarrNoticeAdvancedProps extends HTMLAttributes<HTMLDivElement> {
  marr: MarrPdf[];
}

function MarrNoticeAdvanced({
  marr,
}: MarrNoticeAdvancedProps) {

  return (
    marr.length > 0 && (
      <>
        <h2 className={fr.cx("fr-h6", "fr-mb-1w")}>
          Mesure additionnelles de réduction du risque (MARR)
        </h2>
        <div className={fr.cx("fr-text--sm", "fr-mb-1w")}>
          <ul>
            <li>Guide médecin et Guide pharmacien décrivant les mesures de réduction des risques importants identifiés de tératogénicité, de troubles psychiatriques et de troubles lipidiques et hépatiques.</li>
            <li>Brochure destinée aux patients et patientes pour les informer sur les risques importants identifiés de tératogénicité, troubles psychiatriques, troubles lipidiques et hépatiques.</li>
            <li>Formulaire d’accord de soin pour les patientes en âge de procréer.</li>
            <li>Carte Patiente pour le suivi du plan de prévention des grossesses.</li>
            <li>Courrier de liaison entre le dermatologue envisageant d’initier un traitement chez une femme en âge de procréer et le médecin en charge de la contraception.</li>
            <li>Courrier de liaison entre le dermatologue initiant le traitement et le médecin en charge du suivi du ou de la patiente.</li>
          </ul>
        </div>
        <div className={fr.cx("fr-mb-2w")}>
          <Link 
            className={fr.cx("fr-icon-arrow-right-line", "fr-link--icon-left", "fr-text--sm")} 
            href="https://ansm.sante.fr"
            target="_blank"
          >
            En savoir plus sur le site de l'ANSM
          </Link>
        </div>
        <MarrResumeList marr={marr} inLine/>
      </>
    )
  );
};

export default MarrNoticeAdvanced;
