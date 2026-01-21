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
import MedicamentContent from "./MedicamentContent";
import { getMarr } from "@/db/utils/marr";
import { DetailedSpecialite } from "@/types/SpecialiteTypes";
import { PregnancyAlert } from "@/types/PregancyTypes";
import { PediatricsInfo } from "@/types/PediatricTypes";
import { Presentation } from "@/types/PresentationTypes";


interface MedicamentContainerProps extends HTMLAttributes<HTMLDivElement> {
  atcList: string[];
  atc2?: ATC;
  atcCode?: string;
  specialite?: DetailedSpecialite;
  composants: Array<SpecComposant & SubstanceNom>;
  isPrinceps: boolean;
  delivrance: SpecDelivrance[];
  presentations: Presentation[];
}

function MedicamentContainer({
  atcList,
  atc2,
  atcCode,
  specialite,
  composants,
  isPrinceps,
  delivrance,
  presentations,
  ...props
}: MedicamentContainerProps) {

  const [currentSpec, setCurrentSpec] = useState<DetailedSpecialite>();

  const [pregnancyPlanAlert, setIsPregnancyPlanAlert] = useState<PregnancyAlert>();
  const [isPregnancyMentionAlert, setIsPregnancyMentionAlert] = useState<boolean>(false);
  const [pediatrics, setPediatrics] = useState<PediatricsInfo | undefined>(undefined);
  const [marr, setMarr] = useState<Marr>();

  const loadSpecData = useCallback(
    async (
      CIS: string
    ) => {
      try {
        const pregnancyMentionAlert = await getPregnancyMentionAlert(CIS);
        setIsPregnancyMentionAlert(pregnancyMentionAlert);
        const pediatrics = await getPediatrics(CIS);
        setPediatrics(pediatrics);

        const marr: Marr = await getMarr(CIS);
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
      setCurrentSpec(specialite);
      loadSpecData(specialite.SpecId);
    }
  }, [specialite, setCurrentSpec, loadSpecData]);

  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
        {(pregnancyPlanAlert || isPregnancyMentionAlert || pediatrics?.contraindication) && (
          <ContentContainer className={fr.cx("fr-col-12")}>
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
                      <Link href="https://ansm.sante.fr/dossiers-thematiques/medicaments-et-grossesse/les-programmes-de-prevention-des-grossesses" target="_blank" rel="noopener noreferrer">
                        plan de prévention grossesse
                      </Link>.<br />
                      Il peut présenter des risques pour le fœtus (malformations, effets toxiques).<br />
                      Lisez attentivement la notice et parlez-en à un professionnel de santé avant toute utilisation.
                      <br />
                      <a target="_blank" href={pregnancyPlanAlert.link} rel="noopener noreferrer">
                        En savoir plus sur le site de l’ANSM
                      </a>
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
          </ContentContainer>
        )}
        <MedicamentContent
          atcList={atcList}
          atc2={atc2}
          atcCode={atcCode}
          specialite={currentSpec}
          composants={composants}
          isPrinceps={isPrinceps}
          delivrance={delivrance}
          isPregnancyPlanAlert={!!pregnancyPlanAlert}
          isPregnancyMentionAlert={isPregnancyMentionAlert}
          pediatrics={pediatrics}
          presentations={presentations}
          marr={marr}
        />
      </div>
    </ContentContainer>
  );
};

export default MedicamentContainer;
