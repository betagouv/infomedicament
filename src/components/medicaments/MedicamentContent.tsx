"use client";

import MedicamentContentLoading from "./MedicamentContentLoading";
import { WithMedicamentData, type MedicamentData } from "./MedicamentData";
import ContentContainer from "../generic/ContentContainer";
import type { CompositionComponent } from "@/types/SubstanceTypes";
import {
  HTMLAttributes,
  lazy,
  startTransition,
  Suspense,
  useCallback,
  useEffect,
  useState,
} from "react";
import { ATC } from "@/types/ATCTypes";
import {
  DelivranceCondition,
  DetailedSpecialite,
} from "@/types/SpecialiteTypes";
import { Presentation } from "@/types/PresentationTypes";
import { trackEvent } from "@/services/tracking";
const AdvancedContent = lazy(() => import("./AdvancedContent"));
import NoticeContent from "./NoticeContent";
import { AnchorMenu } from "./advanced/DetailedSubMenu";
import GoTopButton from "../generic/GoTopButton";

interface MedicamentContentProps extends HTMLAttributes<HTMLDivElement> {
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
  const [isAdvanced, setIsAdvanced] = useState<boolean>(false);
  const [advancedAnchor, setAdvancedAnchor] = useState<AnchorMenu>();

  const onGoToAdvanced = useCallback(
    (enabled: boolean) => {
      startTransition(() => setIsAdvanced(enabled));
      if (!enabled) setAdvancedAnchor(undefined);
    },
    [setIsAdvanced],
  );
  const onGoToAdvancedAnchor = useCallback(
    (anchor?: AnchorMenu) => {
      if (anchor) {
        setAdvancedAnchor(anchor);
      }
      startTransition(() => setIsAdvanced(true));
    },
    [setIsAdvanced, setAdvancedAnchor],
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
                advancedAnchor={advancedAnchor}
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
