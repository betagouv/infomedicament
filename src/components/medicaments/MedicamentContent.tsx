"use client";

import ContentContainer from "../generic/ContentContainer";
import { SpecDelivrance } from "@/db/pdbmMySQL/types";
import { BdpmComposant } from "@/db/types";
import { getPediatrics } from "@/db/utils/pediatrics";
import { HTMLAttributes, lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Marr } from "@/types/MarrTypes";
import { ATC } from "@/types/ATCTypes";
import { DetailedSpecialite, NoticeData, NoticeRCPContentBlock } from "@/types/SpecialiteTypes";
import { PregnancyAlert } from "@/types/PregancyTypes";
import { PediatricsInfo } from "@/types/PediatricTypes";
import { Presentation } from "@/types/PresentationTypes";
import { trackEvent } from "@/services/tracking";
import { FicheInfos } from "@/types/FicheInfoTypes";
const AdvancedContent = lazy(() => import("./AdvancedContent"));
import NoticeContent from "./NoticeContent";
import { AnchorMenu } from "./advanced/DetailedSubMenu";
import { Definition } from "@/types/GlossaireTypes";
import GoTopButton from "../generic/GoTopButton";
import { ShortIndication } from "@/types/IndicationsTypes";
import { ArticleCardResume } from "@/types/ArticlesTypes";


interface MedicamentContentProps extends HTMLAttributes<HTMLDivElement> {
  atcList: string[];
  atc2?: ATC;
  atcCode?: string;
  specialite?: DetailedSpecialite;
  composants: BdpmComposant[];
  isPrinceps: boolean;
  delivrance: SpecDelivrance[];
  presentations: Presentation[];
  title: string;
  indications: ShortIndication[];
  notice?: NoticeData;
  indicationsBlock?: NoticeRCPContentBlock;
  ficheInfos?: FicheInfos;
  definitions: Definition[];
  pregnancyPlanAlert?: PregnancyAlert;
  isPregnancyMentionAlert: boolean;
  pediatrics?: PediatricsInfo;
  marr?: Marr;
  articles: ArticleCardResume[];
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
  title,
  indications,
  notice,
  indicationsBlock,
  ficheInfos,
  definitions,
  pregnancyPlanAlert,
  isPregnancyMentionAlert,
  pediatrics,
  marr,
  articles,
  ...props
}: MedicamentContentProps) {

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
      if (anchor) {
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
      composants: BdpmComposant[]
    ) => {
      try {
        const pregnancyPlanAlert = (await getAllPregnancyPlanAlerts()).find((s) =>
          composants.find((c) => Number(c.code_substance) === Number(s.id)),
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
      {isAdvanced
        ? (
          <Suspense fallback={null}>
            <AdvancedContent
              atcCode={atcCode}
              specialite={specialite}
              composants={composants}
              isPrinceps={isPrinceps}
              delivrance={delivrance}
              pregnancyPlanAlert={pregnancyPlanAlert}
              isPregnancyMentionAlert={isPregnancyMentionAlert}
              pediatrics={pediatrics}
              presentations={presentations}
              marr={marr}
              ficheInfos={ficheInfos}
              definitions={definitions}
              indicationsBlock={indicationsBlock}
              advancedAnchor={advancedAnchor}
              title={title}
              onGoToAdvanced={onGoToAdvanced}
            />
          </Suspense>
        ) : (
          <NoticeContent
            atcList={atcList}
            atc2={atc2}
            specialite={specialite}
            composants={composants}
            isPrinceps={isPrinceps}
            delivrance={delivrance}
            pregnancyPlanAlert={pregnancyPlanAlert}
            isPregnancyMentionAlert={isPregnancyMentionAlert}
            pediatrics={pediatrics}
            presentations={presentations}
            marr={marr}
            notice={notice}
            ficheInfos={ficheInfos}
            definitions={definitions}
            indicationsBlock={indicationsBlock}
            title={title}
            indications={indications}
            articles={articles}
            onGoToAdvanced={onGoToAdvanced}
            onGoToAdvancedAnchor={onGoToAdvancedAnchor}
          />
        )}
        <GoTopButton />
    </ContentContainer>
  );
};

export default MedicamentContent;
