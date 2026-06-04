"use server";
import "server-cli-only";

import { cache } from "react";
import {
  SpecDelivrance,
  Specialite,
} from "@/db/pdbmMySQL/types";
import { pdbmMySQL } from "@/db/pdbmMySQL";
import { sql } from "kysely";
import db from "@/db";
import { getFullPresentations } from "@/db/utils/presentation";
import { unstable_cache } from "next/cache";
import { DetailedSpecialite, ResumeSpecGroup, ResumeSpecialite } from "@/types/SpecialiteTypes";
import { Presentation } from "@/types/PresentationTypes";
import { getComposants } from "./composants";
import { formatSpecialitesResume, formatSpecialitesResumeFromGroups } from "@/utils/specialites";

export async function getNoticeRcpLastUpdated(): Promise<Date | null> {
  const result = await db
    .selectFrom("bdpm_document")
    .select((eb) => eb.fn.max("date_modification").as("lastUpdated"))
    .executeTakeFirst();

  return result?.lastUpdated ?? null;
}

export const getMarketedMedicamentCount = unstable_cache(async function(): Promise<number> {
  const result = await db
    .selectFrom("bdpm_specialite")
    .where("statut_amm", "=", "ACTIVE")
    .select((eb) => eb.fn.countAll<number>().as("count"))
    .executeTakeFirstOrThrow();

  return result.count;
}, ["marketed-medicament-count"], { revalidate: 3600 });

export async function getSpecialiteName(CIS: string): Promise<string> {
  const result = await db
    .selectFrom("bdpm_specialite")
    .where("cis", "=", CIS)
    .select("denomination")
    .executeTakeFirst();

  return result?.denomination ?? "";
}

export const getDetailedSpecialite = cache(
  async (
    CIS: string
  ) : Promise<DetailedSpecialite | undefined> => {
  const specialite: DetailedSpecialite | undefined = await pdbmMySQL
    .selectFrom("Specialite")
    .leftJoin("StatutAdm", "StatutAdm.StatId", "Specialite.StatId")
    .leftJoin("StatutComm", "StatutComm.CommId", "Specialite.CommId")
    .leftJoin("Spec_Titu", "Spec_Titu.SpecId", "Specialite.SpecId")
    .leftJoin("Titulaire", "Titulaire.TituId", "Spec_Titu.TituId")
    .leftJoin ("Specialite as GenSpecialite", "GenSpecialite.SpecId", "Specialite.SpecGeneId")
    .where("Specialite.SpecId", "=", CIS)
    .where("Specialite.IsBdm", "=", 1)
    .selectAll("Specialite")
    .select("StatutAdm.StatLibCourt as statutAutorisation")
    .select("StatutComm.CommLibCourt as statutComm")
    .select("GenSpecialite.SpecDenom01 as generiqueName")
    .select(({ selectFrom }) => [
      selectFrom("VUEmaEpar")
        .whereRef("Specialite.SpecId", "=", "VUEmaEpar.SpecId")
        .select("VUEmaEpar.UrlEpar")
        .limit(1)
        .as("urlCentralise")
    ]) // Il n'y en a qu'un
    .select(({ fn }) => [
      fn<string>("GROUP_CONCAT", ["Titulaire.TituRSLong"]).as("titulairesList"),
    ])
    .groupBy(["Specialite.SpecId"]) //Nécessaire pour le JSON_ARRAYAGG
    .distinct()
    .executeTakeFirst();

  return specialite;
});

export const getSpecialite = cache(async (CIS: string) => {

  const specialite: DetailedSpecialite | undefined = await getDetailedSpecialite(CIS);

  const composants = specialite ? await getComposants(CIS) : [];

  const presentations: Presentation[] = 
    specialite 
      ? await getFullPresentations(CIS)
      : [];  

  const delivrance: SpecDelivrance[] = 
    specialite
      ? await pdbmMySQL
        .selectFrom("Spec_Delivrance")
        .where("SpecId", "=", CIS)
        .innerJoin(
          "DicoDelivrance",
          "Spec_Delivrance.DelivId",
          "DicoDelivrance.DelivId",
        )
        .selectAll()
        .orderBy("DicoDelivrance.DelivLong")
        .execute()
      : [];

  return {
    specialite,
    composants,
    presentations,
    delivrance,
  };
});

export const getAllSpecialites = cache(async function () {
  return await db
    .selectFrom("bdpm_specialite")
    .where("statut_amm", "=", "ACTIVE")
    .selectAll()
    .orderBy("denomination")
    .execute();
})

export const getResumeSpecsGroupsWithLetter = cache(async function (letter: string): Promise<ResumeSpecGroup[]> {
  const result = await db
    .selectFrom("resume_medicaments")
    .where(({ eb, ref }) => eb(
      sql<string>`upper(${ref("groupName")})`, "like", `${letter.toUpperCase()}%`
    ))
    .selectAll()
    .orderBy("groupName")
    .execute();
  return formatSpecialitesResumeFromGroups(result);
});

export const getResumeSpecsGroupsWithIndication = cache(async function (indicationsIds: number): Promise<ResumeSpecGroup[]> {
  const result = await db
    .selectFrom("resume_medicaments")
    .where("indicationsIds", "&&", Array([indicationsIds]))
    .selectAll()
    .orderBy("groupName")
    .execute();
  return formatSpecialitesResumeFromGroups(result);
});

export const getResumeSpecsGroupsWithCIS = cache(async function (CISList: string[]): Promise<ResumeSpecGroup[]> {
  if (CISList.length === 0) return [];
  const result = await db
    .selectFrom("resume_medicaments")
    .where("CISList", "&&", Array(CISList))
    .selectAll()
    .orderBy("groupName")
    .execute();
  return formatSpecialitesResumeFromGroups(result);
});

export const getResumeSpecialitesWithCIS = cache(async function (CISList: string[]): Promise<ResumeSpecialite[]> {
  if (CISList.length === 0) return [];
  const result = await db
    .selectFrom("resume_specialites")
    .where("specId", "in", CISList)
    .selectAll()
    .orderBy("groupName")
    .execute();
  return formatSpecialitesResume(result);
});

export const getResumeSpecsGroupsWithCISSubsIds = cache(
  async function (
    CISList: string[],
    SubsIds: string[]
  ): Promise<ResumeSpecGroup[]> {
    if (CISList.length === 0) return [];
    const result = await db
      .selectFrom("resume_medicaments")
      .where(({ eb }) =>
        SubsIds.length
          ? eb.or([
            eb("CISList", "&&", Array(CISList)),
            eb("subsIds", "&&", Array(SubsIds)),
          ])
          : eb("CISList", "&&", Array(CISList)),
      )
      .selectAll()
      .orderBy("groupName")
      .execute();
    return formatSpecialitesResumeFromGroups(result);
  });

export const getSubstanceSpecialites = unstable_cache(async function (
  subsNomsIDs: (string | string[])
) {
  const ids: string[] = !Array.isArray(subsNomsIDs) ? [subsNomsIDs] : subsNomsIDs;
  const subsData = await db
    .selectFrom("resume_substances")
    .where("NomId", "in", ids)
    .select("SubsId")
    .execute();
  const subsIds = subsData.map((r) => r.SubsId);
  if (subsIds.length === 0) return [];

  const cisList = await db
    .selectFrom("bdpm_composant")
    .where("code_substance", "in", subsIds)
    .groupBy("cis")
    .having((eb) => eb(eb.fn.countAll(), ">=", eb.val(subsIds.length)))
    .select("cis")
    .execute();
  const cisCodes = cisList.map((r) => r.cis);
  if (cisCodes.length === 0) return [];

  return db
    .selectFrom("bdpm_specialite")
    .where("cis", "in", cisCodes)
    .where("statut_amm", "=", "ACTIVE")
    .selectAll()
    .execute();
},
  ["substance-specialites"],
  { revalidate: 3600 } // cache for one hour
);

export const getSubstanceSpecialitesCIS = unstable_cache(async function (
  subsNomsIDs: (string | string[])
): Promise<string[]> {
  const ids: string[] = !Array.isArray(subsNomsIDs) ? [subsNomsIDs] : subsNomsIDs;
  const subsData = await db
    .selectFrom("resume_substances")
    .where("NomId", "in", ids)
    .select("SubsId")
    .execute();
  const subsIds = subsData.map((r) => r.SubsId);
  if (subsIds.length === 0) return [];

  const cisList = await db
    .selectFrom("bdpm_composant")
    .innerJoin("bdpm_specialite", "bdpm_specialite.cis", "bdpm_composant.cis")
    .where("bdpm_composant.code_substance", "in", subsIds)
    .where("bdpm_specialite.statut_amm", "=", "ACTIVE")
    .groupBy("bdpm_composant.cis")
    .having((eb) => eb(eb.fn.countAll(), ">=", eb.val(subsIds.length)))
    .select("bdpm_composant.cis")
    .execute();
  return cisList.map((r) => r.cis);
},
  ["substance-specialites-cis"],
  { revalidate: 3600 } // cache for one hour
);