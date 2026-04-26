"use client";
import { HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { Specialite } from "@/db/pdbmMySQL/types";
import { isAIP, isAlerteSecurite, isCommercialisee } from "@/utils/specialites";
import { ResumeSpecialite } from "@/types/SpecialiteTypes";

interface DataBlockGenericIconsProps extends HTMLAttributes<HTMLDivElement> {
  specialite: Specialite | ResumeSpecialite;
  isSurveillanceRenforcee?: boolean;
}

function DataBlockGenericIcons({
  specialite,
  isSurveillanceRenforcee,
}: DataBlockGenericIconsProps) {
  
  return (
    <>
      {isAIP(specialite) && (
        <Tooltip
          title="Ce médicament est en Autorisation d'Importation parallèle."
          kind="hover"
        >
          <b className={fr.cx("fr-ml-1v", "fr-text--sm")} style={{color: "#89BA12"}}>
            AIP
          </b>
        </Tooltip>
      )}
      {!isCommercialisee(specialite) && (
        <Tooltip
          title="Ce médicament n'est ou ne sera bientôt plus disponible sur le marché."
          kind="hover"
        >
          <i 
            className={fr.cx("fr-icon-close-circle-line", "fr-ml-1v")} 
            style={{color: "var(--text-action-high-blue-france)"}}
          />
        </Tooltip>
      )}
      {isAlerteSecurite(specialite) && (
        <Tooltip
          title="Alerte de sécurité sanitaire sur ce médicament, veuillez consulter la notice pour en savoir plus."
          kind="hover"
        >
          <i 
            className={fr.cx("fr-icon-alert-line", "fr-ml-1v")} 
            style={{color: "var(--red-marianne-main-472)"}}
          />
        </Tooltip>
      )}
      {isSurveillanceRenforcee && (
        <Tooltip
          title="Ce médicament fait l'objet d'une information importante ou il est sous surveillance renforcée."
          kind="hover"
        >
          <i 
            className={fr.cx("fr-icon-information-line", "fr-ml-1v")} 
            style={{color: "var(--warning-425-625)"}}
          />
        </Tooltip>
      )}
    </>
  );
};

export default DataBlockGenericIcons;
