"use client";

import { use, type ReactNode } from "react";
import type { NoticeData } from "@/types/SpecialiteTypes";
import type { FicheInfos } from "@/types/FicheInfoTypes";
import type { Definition } from "@/types/GlossaireTypes";
import type { ShortIndication } from "@/types/IndicationsTypes";
import type { PregnancyAlert } from "@/types/PregancyTypes";
import type { PediatricsInfo } from "@/types/PediatricTypes";
import type { Marr } from "@/types/MarrTypes";
import type { ArticleCardResume } from "@/types/ArticlesTypes";
import type { AnsmVideos } from "@/db/types";
import type { AnsmStock } from "@/types/StockTypes";

export interface MedicamentData {
  notice?: NoticeData;
  ficheInfos?: FicheInfos;
  definitions: Definition[];
  indications: ShortIndication[];
  indicationsBlock?: string;
  pregnancyPlanAlert?: PregnancyAlert;
  isPregnancyMentionAlert: boolean;
  pediatrics?: PediatricsInfo;
  marr?: Marr;
  articles: ArticleCardResume[];
  videos?: AnsmVideos[];
  stocks: AnsmStock[];
  isPrinceps: boolean;
  isGeneric: boolean;
}

// Only the data-dependent sections suspend; the surrounding controls stay mounted.
export function WithMedicamentData({
  data,
  children,
}: {
  data: Promise<MedicamentData>;
  children: (data: MedicamentData) => ReactNode;
}) {
  return children(use(data));
}
