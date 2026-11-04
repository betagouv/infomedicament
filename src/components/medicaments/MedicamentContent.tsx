"use client";

import MedicamentContentLoading from "./MedicamentContentLoading";
import { WithMedicamentData, type MedicamentData } from "./MedicamentData";
import ContentContainer from "../generic/ContentContainer";
import type { CompositionComponent } from "@/types/SubstanceTypes";
import {
  HTMLAttributes,
  lazy,
  Suspense,
  useCallback,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { ATC } from "@/types/ATCTypes";
import {
  DelivranceCondition,
  DetailedSpecialite,
} from "@/types/SpecialiteTypes";
import { Presentation } from "@/types/PresentationTypes";
import { trackEvent } from "@/services/tracking";
const AdvancedContent = lazy(() => import("./AdvancedContent"));
import NoticeContent from "./NoticeContent";
import GoTopButton from "../generic/GoTopButton";

interface MedicamentContentProps extends HTMLAttributes<HTMLDivElement> {
  CIS: string;
  /** Detailed version (RCP, advanced data), served at /medicaments/[CIS]/details */
  isAdvanced: boolean;
  atcList: string[];
  atc2?: ATC;
  atcCode?: string;
  specialite?: DetailedSpecialite;
  composants: CompositionComponent[];
  delivrance: DelivranceCondition[];
  presentations: Presentation[];
  title: string;
  data: Promise<MedicamentData>;
}

function MedicamentContent({
  CIS,
  isAdvanced,
  atcList,
  atc2,
  atcCode,
  specialite,
  composants,
  delivrance,
  presentations,
  title,
  data,
  ...props
}: MedicamentContentProps) {
  const router = useRouter();

  const onGoToAdvanced = useCallback(
    (enabled: boolean) => {
      router.push(enabled ? `/medicaments/${CIS}/details` : `/medicaments/${CIS}`);
    },
    [router, CIS],
  );
  // The anchor is not handled yet: opens the detailed version at its top
  const onGoToAdvancedAnchor = useCallback(
    () => router.push(`/medicaments/${CIS}/details`),
    [router, CIS],
  );

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
      {isAdvanced ? (
        <Suspense
          fallback={<MedicamentContentLoading title={title} contained />}
        >
          <WithMedicamentData data={data}>
            {(loaded) => (
              <AdvancedContent
                {...loaded}
                pregnancyPlanAlert={loaded.pregnancyPlanAlert}
                pediatrics={loaded.pediatrics}
                atcCode={atcCode}
                specialite={specialite}
                composants={composants}
                delivrance={delivrance}
                presentations={presentations}
                title={title}
                onGoToAdvanced={onGoToAdvanced}
              />
            )}
          </WithMedicamentData>
        </Suspense>
      ) : (
        <NoticeContent
          data={data}
          atcList={atcList}
          atc2={atc2}
          specialite={specialite}
          composants={composants}
          delivrance={delivrance}
          presentations={presentations}
          title={title}
          onGoToAdvanced={onGoToAdvanced}
          onGoToAdvancedAnchor={onGoToAdvancedAnchor}
        />
      )}
      <GoTopButton />
    </ContentContainer>
  );
}

export default MedicamentContent;
