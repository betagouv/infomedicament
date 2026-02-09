"use client";

import ContentContainer from "../generic/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes, useEffect, useState } from "react";
import Link from "next/link";
import { DetailedSpecialite, FicheInfos } from "@/types/SpecialiteTypes";
import { isAIP, isAlerteSecurite, isCommercialisee } from "@/utils/specialites";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Image from "next/image";

interface MedicamentContentHeaderProps extends HTMLAttributes<HTMLDivElement> {
  specialite?: DetailedSpecialite;
  ficheInfos?: FicheInfos;
}

function MedicamentContentHeader({
  specialite,
  ficheInfos,
  ...props
}: MedicamentContentHeaderProps) {

  const [currentSpec, setCurrentSpec] = useState<DetailedSpecialite>();
  const [currentFicheInfos, setCurrentFicheInfos] = useState<FicheInfos>();
  
  useEffect(() => {
    if (specialite) {
      setCurrentSpec(specialite);
    }
  }, [specialite, setCurrentSpec]);

    useEffect(() => {
    if (ficheInfos) {
      setCurrentFicheInfos(ficheInfos);
    }
  }, [ficheInfos, setCurrentFicheInfos]);

  return (
    <div {...props}>
      {(currentSpec && !isCommercialisee(currentSpec)) && (
        <ContentContainer whiteContainer className={fr.cx("fr-mb-4w")}>
          <Alert
            description="Si vous prenez actuellement ce médicament, il vous est recommandé d'en parler avec votre médecin ou avec votre pharmacien qui pourra vous orienter vers un autre traitement."
            severity="info"
            title="Ce médicament n'est ou ne sera bientôt plus disponible sur le marché."
            small
          />
        </ContentContainer>
      )}
      {(currentSpec && isAIP(currentSpec)) && (
        <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-4w")} style={{display: "flex"}}>
          <Image
            src="/icons/aip.png"
            alt="AIP"
            width={32}
            height={17}
            className={fr.cx("fr-mr-1w", "fr-mt-1v")}
          />
          <div>
            Ce médicament est mis sur le marché en France en tant qu'importation parallèle
            {(currentSpec.generiqueName && currentSpec.SpecGeneId) && (
              <>
                {" "}du médicament{" "}
                <Link
                  href={`/medicaments/${currentSpec.SpecGeneId}`}
                  aria-description="Lien vers le médicament"
                >
                  {currentSpec.generiqueName}
                </Link>
              </>
            )}
            .<br/>
            L'importateur est{" "}
            {currentSpec.titulairesList 
              ? (<span>{currentSpec.titulairesList}</span>)
              : "Inconnu"
            }.
          </div>
        </ContentContainer>
      )}
      {(currentSpec && currentSpec.ProcId === "60") && (
        <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-4w")}>
          Ce médicament est un médicament homéopathique à nom commun soumis à enregistrement.
          <br/><br/>
          Aucune indication thérapeutique, aucune posologie et aucune notice ne sont attribuées
            aux médicaments homéopathiques à nom commun. 
          En effet, pour ces médicaments, il revient aux professionnels de santé d'en déterminer l'indication 
          (pathologies ou symptômes) et la posologie. 
          L'indication et la posologie sont ainsi adaptées à chaque patient en prenant en 
          compte les données de l'usage traditionnel homéopathique. Ces médicaments peuvent 
          étre délivrés par le pharmacien sans prescription médicale. 
        </ContentContainer>
      )}
      {(currentSpec && isAlerteSecurite(currentSpec)) && (
        <ContentContainer whiteContainer className={fr.cx("fr-mb-4w")}>
          <Alert 
            severity="error"
            title="Attention ce médicament fait l’objet d’un retrait ou d’une suspension d’autorisation 
              ou d’utilisation pour des raisons de santé publique."
            description="Si vous prenez ce médicament, il vous est recommandé de prendre contact, dans les meilleurs délais, 
              avec votre médecin ou avec votre pharmacien qui vous indiquera la conduite à tenir. 
              Pour plus d'information, vous pouvez consulter les informations de sécurité ci-dessous."
            small
          />
        </ContentContainer>
      )}
      {(currentFicheInfos && currentFicheInfos.isSurveillanceRenforcee) && (
        <ContentContainer whiteContainer className={fr.cx("fr-mb-4w")}>
          <Alert 
            severity="warning"
            title="Médicament sous surveillance renforcée"
            className={fr.cx("fr-pb-2w", "fr-pt-2w")}
            description={
              <div style={{display: "flex"}}>
                <Image
                  src="/icons/surveillance_renforcee.png"
                  alt="Médicament sous surveillance renforcée"
                  width={21}
                  height={19}
                  className={fr.cx("fr-mr-1w", "fr-mt-1v")}
                />
                <div>
                  Ce médicament fait l'objet d'une surveillance renforcée. Pour plus d'informations,&nbsp;
                  <Link
                    href="https://ansm.sante.fr/qui-sommes-nous/nos-missions/assurer-la-securite-des-produits-de-sante/p/surveiller-les-medicaments#title"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    cliquez ici
                  </Link>.
                </div>
              </div>
            }
            small
          />
        </ContentContainer>
      )}
    </div>
  );
};

export default MedicamentContentHeader;
