import "server-cli-only";
import type { MedicamentData } from "@/components/medicaments/MedicamentData";

import { getDetailedSpecialite, getSpecialite } from "./specialities";
import { getComposants } from "./composants";
import { getAtc1, getAtc2 } from "./atc";
import { getAtcCode } from "@/utils/atc";
import { isGenericSpecialite, isPrincepsSpecialite } from "./generics";
import {
  getSpecialitesIndications,
  getSpecialitePathologies,
} from "./indications";
import { getNotice } from "./notice";
import {
  getAllPregnancyPlanAlerts,
  getPregnancyMentionAlert,
} from "./pregnancy";
import { findPregnancyPlanAlert } from "./pregnancyCatalog";
import { getPediatrics } from "./pediatrics";
import { getMarr } from "./marr";
import { getArticlesFromFilters } from "./articles";
import { getFicheInfos } from "./ficheInfos";
import { getHighlightedGlossaryDefinitions } from "./glossary";
import type { CompositionComponent } from "@/types/SubstanceTypes";
import { getIndicationsBlock } from "@/utils/noticeHtml";
import { getVideosFromCIS } from "./videos";
import { getStockFromCIS } from "./stocks";

async function getMedicamentAtc(CIS: string) {
  const atcCode = await getAtcCode(CIS);
  const [atc1, atc2] = atcCode
    ? await Promise.all([getAtc1(atcCode), getAtc2(atcCode)])
    : [undefined, undefined];
  const atcList = [atc1?.code, atc2?.code]
    .filter((code): code is string => code !== undefined)
    .map((code) => code.trim());
  return { atcCode, atc1, atc2, atcList };
}

async function fetchMedicamentData(
  CIS: string,
  composantsPromise: Promise<CompositionComponent[]>,
  atcListPromise: Promise<string[]>,
) {
  // Articles depend only on composition, ATC and pathologies, not on documents.
  const articlesPromise = Promise.all([
    composantsPromise,
    atcListPromise,
    getSpecialitePathologies(CIS),
  ]).then(([composants, atcList, pathologies]) =>
    getArticlesFromFilters({
      ATCList: atcList,
      substancesList: composants.map((component) => component.SubsId.trim()),
      specialitesList: [CIS],
      pathologiesList: pathologies,
    }),
  );

  const [
    notice,
    ficheInfos,
    definitions,
    pregnancyMentionAlert,
    pediatrics,
    marr,
    allPregnancyPlanAlerts,
    videos,
    stocks,
    articles,
    composants,
  ] = await Promise.all([
    getNotice(CIS),
    getFicheInfos(CIS),
    getHighlightedGlossaryDefinitions(),
    getPregnancyMentionAlert(CIS),
    getPediatrics(CIS),
    getMarr(CIS),
    getAllPregnancyPlanAlerts(),
    getVideosFromCIS(CIS),
    getStockFromCIS(CIS),
    articlesPromise,
    composantsPromise,
  ]);

  return {
    notice,
    ficheInfos,
    definitions,
    isPregnancyMentionAlert: pregnancyMentionAlert,
    pediatrics,
    marr,
    pregnancyPlanAlert: findPregnancyPlanAlert(
      composants.map((component) => component.SubsId),
      allPregnancyPlanAlerts,
    ),
    indicationsBlock: notice
      ? getIndicationsBlock(notice.contentHtml)
      : undefined,
    articles,
    videos,
    stocks,
  };
}

export async function getMedicamentPageData(CIS: string) {
  // Keep the visibility check ahead of unrelated lookups. Cached lookups share
  // specialty and composition data with fiche assembly.
  const specialite = await getDetailedSpecialite(CIS);
  if (!specialite) {
    return {
      ...(await getSpecialite(CIS)),
      indications: [],
      atcCode: undefined,
      atc1: undefined,
      atc2: undefined,
      atcList: [],
      isPrinceps: false,
      isGeneric: false,
      medData: undefined,
    };
  }

  const atcPromise = getMedicamentAtc(CIS);
  // Start secondary data immediately, but let the page stream its header and
  // controls while the shared data promise resolves inside the content sections.
  const medData: Promise<MedicamentData> = Promise.all([
    fetchMedicamentData(
      CIS,
      getComposants(CIS),
      atcPromise.then(({ atcList }) => atcList),
    ),
    getSpecialitesIndications([CIS]),
    isPrincepsSpecialite(CIS),
    isGenericSpecialite(CIS),
  ]).then(([data, indications, isPrinceps, isGeneric]) => ({
    ...data,
    indications,
    isPrinceps,
    isGeneric,
  }));
  const [specialiteData, atc] = await Promise.all([
    getSpecialite(CIS),
    atcPromise,
  ]);
  return { ...specialiteData, ...atc, medData };
}
