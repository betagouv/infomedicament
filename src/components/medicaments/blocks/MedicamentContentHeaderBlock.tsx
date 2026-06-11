"use client";

import ContentContainer from "@/components/generic/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes } from "react";
import Link from "next/link";
import { DetailedSpecialite } from "@/types/SpecialiteTypes";
import { isAIP, isAlerteSecurite, isCommercialisee, isHomeopathie } from "@/utils/specialites";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Image from "next/image";
import { FicheInfos } from "@/types/FicheInfoTypes";
import { Definition } from "@/types/GlossaireTypes";
import WithDefinition from "@/components/glossary/WithDefinition";
import { getDefinition } from "@/utils/glossary";
import { PediatricsInfo } from "@/types/PediatricTypes";
import { PregnancyAlert } from "@/types/PregancyTypes";

interface MedicamentContentHeaderBlockProps extends HTMLAttributes<HTMLDivElement> {
  specialite?: DetailedSpecialite;
  ficheInfos?: FicheInfos;
  definitions?: Definition[];
  pregnancyPlanAlert: PregnancyAlert | undefined;
  isPregnancyMentionAlert: boolean;
  pediatrics: PediatricsInfo | undefined;
}

function MedicamentContentHeaderBlock({
  specialite,
  ficheInfos,
  definitions,
  pregnancyPlanAlert,
  isPregnancyMentionAlert,
  pediatrics,
  ...props
}: MedicamentContentHeaderBlockProps) {


  return (
    <div {...props}>
      {pregnancyPlanAlert && (
        <ContentContainer whiteContainer className={fr.cx("fr-mb-2w")}>
          <Alert
            severity={"warning"}
            title={"Plan de prévention grossesse"}
            description={
              <p>
                Ce médicament est concerné par un{" "}
                <Link 
                  href="https://ansm.sante.fr/dossiers-thematiques/medicaments-et-grossesse/les-programmes-de-prevention-des-grossesses"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  plan de prévention grossesse
                </Link>.<br />
                Il peut présenter des risques pour le fœtus (malformations, effets toxiques).<br />
                Lisez attentivement la notice et parlez-en à un professionnel de santé avant toute utilisation.
                <br />
                <Link 
                  href={pregnancyPlanAlert.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  En savoir plus sur le site de l’ANSM
                </Link>
              </p>
            }
          />
        </ContentContainer>
      )}
      {(!pregnancyPlanAlert && isPregnancyMentionAlert) && (
        <ContentContainer whiteContainer className={fr.cx("fr-mb-2w")}>
          <Alert
            severity={"warning"}
            title={"Mention contre-indication grossesse"}
            description={
              <p>
                Ce médicament peut présenter des précautions d’usage pendant la grossesse ou l’allaitement. Il peut être autorisé, déconseillé ou contre-indiqué selon les cas.<br />
                Lisez la notice et demandez l’avis d’un professionnel de santé avant toute prise.
              </p>
            }
          />
        </ContentContainer>
      )}
      {pediatrics?.contraindication && (
        <ContentContainer whiteContainer className={fr.cx("fr-mb-2w")}>
          <Alert
            severity={"warning"}
            title={
              "Il existe une contre-indication pédiatrique (vérifier selon l’âge)."
            }
          />
        </ContentContainer>
      )}
      {(specialite && isAlerteSecurite(specialite)) && (
        <ContentContainer whiteContainer className={fr.cx("fr-mb-2w")}>
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
      {(ficheInfos && ficheInfos.isSurveillanceRenforcee) && (
        <ContentContainer whiteContainer className={fr.cx("fr-mb-2w")}>
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
      {(specialite && !isCommercialisee(specialite)) && (
        <ContentContainer whiteContainer className={fr.cx("fr-mb-2w")}>
          <Alert
            description="Si vous prenez actuellement ce médicament, il vous est recommandé d'en parler avec votre médecin ou avec votre pharmacien qui pourra vous orienter vers un autre traitement."
            severity="info"
            title="Ce médicament n'est ou ne sera bientôt plus disponible sur le marché."
            small
          />
        </ContentContainer>
      )}
      {(specialite && isAIP(specialite)) && (
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
            {(specialite.generiqueName && specialite.generique) && (
              <>
                {" "}du médicament{" "}
                <Link
                  href={`/medicaments/${specialite.generique}`}
                  aria-description="Lien vers le médicament"
                >
                  {specialite.generiqueName}
                </Link>
              </>
            )}
            .<br/>
            L'importateur est{" "}
            {specialite.titulairesList 
              ? (<span>{specialite.titulairesList}</span>)
              : "Inconnu"
            }.
          </div>
        </ContentContainer>
      )}
      {(specialite && isHomeopathie(specialite)) && (
        <ContentContainer whiteContainer className={fr.cx("fr-mb-2w", "fr-p-4w")}>
          Ce médicament est un médicament homéopathique à nom commun soumis à{" "}
          <WithDefinition
            definition={definitions && getDefinition(definitions, "Enregistrement des médicaments homéopathiques")}
            word="enregistrement"
          />.
          <br/><br/>
          Aucune indication thérapeutique, aucune posologie et aucune notice ne sont attribuées
            aux médicaments homéopathiques à nom commun. 
          En effet, pour ces médicaments, il revient aux professionnels de santé d'en déterminer l'indication 
          (pathologies ou symptômes) et la posologie. 
          L'indication et la posologie sont ainsi adaptées à chaque patient en prenant en 
          compte les données de l'usage traditionnel homéopathique. Ces médicaments peuvent 
          être délivrés par le pharmacien sans prescription médicale. 
        </ContentContainer>
      )}
    </div>
  );
};

export default MedicamentContentHeaderBlock;
