"use client";

import * as Sentry from "@sentry/nextjs";
import ContentContainer from "../generic/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";
import { SpecComposant, SpecDelivrance, SubstanceNom } from "@/db/pdbmMySQL/types";
import { getPediatrics } from "@/db/utils/pediatrics";
import { HTMLAttributes, useCallback, useEffect, useState } from "react";
import { Marr } from "@/types/MarrTypes";
import Link from "next/link";
import { ATC } from "@/types/ATCTypes";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { getPregnancyMentionAlert, getAllPregnancyPlanAlerts } from "@/db/utils/pregnancy";
import { getMarr } from "@/db/utils/marr";
import { DetailedSpecialite, NoticeData, NoticeRCPContentBlock } from "@/types/SpecialiteTypes";
import { PregnancyAlert } from "@/types/PregancyTypes";
import { PediatricsInfo } from "@/types/PediatricTypes";
import { Presentation } from "@/types/PresentationTypes";
import { trackEvent } from "@/services/tracking";
import { isCentralisee } from "@/utils/specialites";
import { FicheInfos } from "@/types/FicheInfoTypes";
import { getNotice } from "@/db/utils/notice";
import { getFicheInfos } from "@/db/utils/ficheInfos";
import AdvancedContent from "./AdvancedContent";
import NoticeContent from "./NoticeContent";
import { AnchorMenu } from "./advanced/DetailedSubMenu";
import getGlossaryDefinitions from "@/db/utils/glossary";
import { Definition } from "@/types/GlossaireTypes";
import styled from "styled-components";

const AlertsContainer = styled.div`
  margin-bottom: 2rem;
  @media (max-width: 48em) {
    margin-bottom: 1rem;
    padding-left: 0rem !important;
    padding-right: 0rem !important;
  }
`;

interface MedicamentContentProps extends HTMLAttributes<HTMLDivElement> {
  atcList: string[];
  atc2?: ATC;
  atcCode?: string;
  specialite?: DetailedSpecialite;
  composants: Array<SpecComposant & SubstanceNom>;
  isPrinceps: boolean;
  delivrance: SpecDelivrance[];
  presentations: Presentation[];
}

function MedicamentContent({
  atcList,
  atc2,
  atcCode,
  specialite,
  composants,
  isPrinceps,
  delivrance,
  presentations,
  ...props
}: MedicamentContentProps) {

  const [notice, setNotice] = useState<NoticeData>();
  const [indicationBlock, setIndicationBlock] = useState<NoticeRCPContentBlock>();
  const [ficheInfos, setFicheInfos] = useState<FicheInfos>();
  const [definitions, setDefinitions] = useState<Definition[]>([]);

  const [pregnancyPlanAlert, setIsPregnancyPlanAlert] = useState<PregnancyAlert>();
  const [isPregnancyMentionAlert, setIsPregnancyMentionAlert] = useState<boolean>(false);
  const [pediatrics, setPediatrics] = useState<PediatricsInfo | undefined>(undefined);
  const [marr, setMarr] = useState<Marr>();

  const [isAdvanced, setIsAdvanced] = useState<boolean>(false);
  const [advancedAnchor, setAdvancedAnchor] = useState<AnchorMenu>();

  const onGoToAdvanced = useCallback(
    (enabled: boolean) => {
      setIsAdvanced(enabled);
      if(!enabled)
        setAdvancedAnchor(undefined);
    },
    [setIsAdvanced]
  );
  const onGoToAdvancedAnchor = useCallback(
    (anchor?: AnchorMenu) => {
      if(anchor){
        setAdvancedAnchor(anchor);
      } 
      setIsAdvanced(true);
    },
    [setIsAdvanced, setAdvancedAnchor]
  );

  const loadData = useCallback(
    async (
      spec: DetailedSpecialite
    ) => {
      try {
        if (!isCentralisee(spec)) {
          const newNotice = await getNotice(spec.SpecId);
          setNotice(newNotice);
          if (newNotice) {
            if (newNotice.children) {
              newNotice.children.forEach((child: NoticeRCPContentBlock) => {
                if (child.anchor === "Ann3bQuestceque") {
                  setIndicationBlock(child);
                }
              })
            }
          }
        }
        const newFicheInfos = await getFicheInfos(spec.SpecId);
        setFicheInfos(newFicheInfos);      
        const newDefinitions = (await getGlossaryDefinitions()).filter(
          (d) => d.a_souligner,
        );
        setDefinitions(newDefinitions);

        const pregnancyMentionAlert = await getPregnancyMentionAlert(spec.SpecId);
        setIsPregnancyMentionAlert(pregnancyMentionAlert);
        const pediatrics = await getPediatrics(spec.SpecId);
        setPediatrics(pediatrics);

        const marr: Marr = await getMarr(spec.SpecId);
        setMarr(marr);
      } catch (e) {
        Sentry.captureException(e);
      }
    },
    [setIsPregnancyMentionAlert, setPediatrics, setMarr]
  );

  const loadPregnancyPlanAlert = useCallback(
    async (
      composants: Array<SpecComposant & SubstanceNom>
    ) => {
      try {
        const pregnancyPlanAlert = (await getAllPregnancyPlanAlerts()).find((s) =>
          composants.find((c) => Number(c.SubsId.trim()) === Number(s.id)),
        );
        setIsPregnancyPlanAlert(pregnancyPlanAlert);
      } catch (e) {
        Sentry.captureException(e);
      }
    }, [setIsPregnancyPlanAlert,]
  );

  useEffect(() => {
    if (composants) {
      loadPregnancyPlanAlert(composants);
    }
  }, [composants, loadPregnancyPlanAlert]);

  useEffect(() => {
    if (specialite) {
      loadData(specialite);
    }
  }, [specialite, loadData]);

  useEffect(() => {
    const handler = () => {
      if (window.pageYOffset > window.innerHeight) {
        trackEvent("Page médicament", "Scroll");
        window.removeEventListener("scroll", handler);
      }
    };
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <ContentContainer frContainer {...props}>
      {(pregnancyPlanAlert || isPregnancyMentionAlert || pediatrics?.contraindication) && (
        <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
          <AlertsContainer className={fr.cx("fr-col-12")}>
            {pregnancyPlanAlert && (
              <ContentContainer
                whiteContainer
                className={(isPregnancyMentionAlert || pediatrics?.contraindication) ? fr.cx("fr-mb-2w") : ""}
              >
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
              <ContentContainer
                whiteContainer
                className={pediatrics?.contraindication ? fr.cx("fr-mb-2w") : ""}
              >
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
              <ContentContainer whiteContainer>
                <Alert
                  severity={"warning"}
                  title={
                    "Il existe une contre-indication pédiatrique (vérifier selon l’âge)."
                  }
                />
              </ContentContainer>
            )}
          </AlertsContainer>
        </div>
      )}
      {isAdvanced
        ? (
          <AdvancedContent
            atcCode={atcCode}
            specialite={specialite}
            composants={composants}
            isPrinceps={isPrinceps}
            delivrance={delivrance}
            isPregnancyPlanAlert={!!pregnancyPlanAlert}
            isPregnancyMentionAlert={isPregnancyMentionAlert}
            pediatrics={pediatrics}
            presentations={presentations}
            marr={marr}
            ficheInfos={ficheInfos}
            definitions={definitions}
            indicationBlock={indicationBlock}
            advancedAnchor={advancedAnchor}
            onGoToAdvanced={onGoToAdvanced}
          />
        ) : (
          <NoticeContent
            atcList={atcList}
            atc2={atc2}
            specialite={specialite}
            composants={composants}
            isPrinceps={isPrinceps}
            delivrance={delivrance}
            isPregnancyPlanAlert={!!pregnancyPlanAlert}
            isPregnancyMentionAlert={isPregnancyMentionAlert}
            pediatrics={pediatrics}
            presentations={presentations}
            marr={marr}
            notice={notice}
            ficheInfos={ficheInfos}
            definitions={definitions}
            indicationBlock={indicationBlock}
            onGoToAdvanced={onGoToAdvanced}
            onGoToAdvancedAnchor={onGoToAdvancedAnchor}
          />
        )}
    </ContentContainer>
  );
};

export default MedicamentContent;
