"use server";
import "server-cli-only";

import {
  SpecComposant,
  SpecDelivrance,
  Specialite,
  SubstanceNom,
} from "@/db/pdbmMySQL/types";
import { pdbmMySQL } from "@/db/pdbmMySQL";
import { sql } from "kysely";
import db from "@/db";
import { getFullPresentations } from "@/db/utils/presentation";
import { cacheLife } from "next/cache";
import { withSubstances } from "./query";
import {
  DetailedSpecialite,
  ResumeSpecGroup,
  ResumeSpecialite,
} from "@/types/SpecialiteTypes";
import { Presentation } from "@/types/PresentationTypes";
import { getComposants } from "./composants";
import {
  formatSpecialitesResume,
  formatSpecialitesResumeFromGroups,
} from "@/utils/specialites";
import { SpecialiteMetadata } from "../types";

export async function getNoticeRcpLastUpdated(): Promise<Date | null> {
  "use cache: remote";
  cacheLife("hourly");

  const result = await pdbmMySQL
    .selectFrom("Document")
    .select((eb) => eb.fn.max("DocDateMaj").as("lastUpdated"))
    .executeTakeFirst();

  return result?.lastUpdated ?? null;
}

export async function getMarketedMedicamentCount(): Promise<number> {
  "use cache: remote";
  cacheLife("hourly");

  const result = await pdbmMySQL
    .selectFrom("Specialite")
    .where("Specialite.IsBdm", "=", 1)
    .select((eb) => eb.fn.countAll<number>().as("count"))
    .executeTakeFirstOrThrow();

  return result.count;
}

export async function getSpecialiteName(CIS: string): Promise<string> {
  const result = await pdbmMySQL
    .selectFrom("Specialite")
    .where("SpecId", "=", CIS)
    .select("SpecDenom01")
    .executeTakeFirst();

  return result ? result.SpecDenom01 : "";
}

export async function getDetailedSpecialite(
  CIS: string,
): Promise<DetailedSpecialite | undefined> {
  "use cache: remote";
  cacheLife("hourly");

  const specialite: DetailedSpecialite | undefined = await pdbmMySQL
    .selectFrom("Specialite")
    .leftJoin("StatutAdm", "StatutAdm.StatId", "Specialite.StatId")
    .leftJoin("StatutComm", "StatutComm.CommId", "Specialite.CommId")
    .leftJoin("Spec_Titu", "Spec_Titu.SpecId", "Specialite.SpecId")
    .leftJoin("Titulaire", "Titulaire.TituId", "Spec_Titu.TituId")
    .leftJoin(
      "Specialite as GenSpecialite",
      "GenSpecialite.SpecId",
      "Specialite.SpecGeneId",
    )
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
        .as("urlCentralise"),
    ]) // Il n'y en a qu'un
    .select(({ fn }) => [
      fn<string>("GROUP_CONCAT", ["Titulaire.TituRSLong"]).as("titulairesList"),
    ])
    .groupBy(["Specialite.SpecId"]) //Nécessaire pour le JSON_ARRAYAGG
    .distinct()
    .executeTakeFirst();

  return specialite;
}

export async function getSpecialite(CIS: string) {
  "use cache: remote";
  cacheLife("hourly");

  const specialite: DetailedSpecialite | undefined =
    await getDetailedSpecialite(CIS);

  const composants: Array<SpecComposant & SubstanceNom> = specialite
    ? await getComposants(CIS)
    : [];

  const presentations: Presentation[] = specialite
    ? await getFullPresentations(CIS)
    : [];

  const delivrance: SpecDelivrance[] = specialite
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
}

export async function getAllSpecialites() {
  "use cache: remote";
  cacheLife("daily");

  return await pdbmMySQL
    .selectFrom("Specialite")
    .where("Specialite.IsBdm", "=", 1)
    .selectAll()
    .distinct()
    .orderBy("SpecDenom01")
    .execute();
}

export async function getResumeSpecsGroupsWithLetter(
  letter: string,
): Promise<ResumeSpecGroup[]> {
  "use cache: remote";
  cacheLife("daily");

  const result = await db
    .selectFrom("resume_medicaments")
    .where(({ eb, ref }) =>
      eb(
        sql<string>`upper(${ref("groupName")})`,
        "like",
        `${letter.toUpperCase()}%`,
      ),
    )
    .selectAll()
    .orderBy("groupName")
    .execute();
  return formatSpecialitesResumeFromGroups(result);
}

export async function getResumeSpecsGroupsWithIndication(
  indicationsIds: number,
): Promise<ResumeSpecGroup[]> {
  "use cache: remote";
  cacheLife("daily");

  const result = await db
    .selectFrom("resume_medicaments")
    .where("indicationsIds", "&&", Array([indicationsIds]))
    .selectAll()
    .orderBy("groupName")
    .execute();
  return formatSpecialitesResumeFromGroups(result);
}

export async function getResumeSpecsGroupsWithCIS(
  CISList: string[],
): Promise<ResumeSpecGroup[]> {
  "use cache: remote";
  cacheLife("daily");

  if (CISList.length === 0) return [];
  const result = await db
    .selectFrom("resume_medicaments")
    .where("CISList", "&&", Array(CISList))
    .selectAll()
    .orderBy("groupName")
    .execute();
  return formatSpecialitesResumeFromGroups(result);
}

export async function getResumeSpecialitesWithCIS(
  CISList: string[],
): Promise<ResumeSpecialite[]> {
  "use cache: remote";
  cacheLife("daily");

  if (CISList.length === 0) return [];
  const result = await db
    .selectFrom("resume_specialites")
    .where("specId", "in", CISList)
    .selectAll()
    .orderBy("groupName")
    .execute();
  return formatSpecialitesResume(result);
}

export async function getResumeSpecsGroupsWithCISSubsIds(
  CISList: string[],
  SubsIds: string[],
): Promise<ResumeSpecGroup[]> {
  "use cache: remote";
  cacheLife("daily");

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
}

export async function getSubstanceSpecialites(
  subsNomsIDs: string | string[],
): Promise<Specialite[]> {
  "use cache: remote";
  cacheLife("hourly");

  const ids: string[] = !Array.isArray(subsNomsIDs)
    ? [subsNomsIDs]
    : subsNomsIDs;
  return pdbmMySQL
    .selectFrom("Specialite")
    .selectAll("Specialite")
    .where((eb) => withSubstances(eb.ref("Specialite.SpecId"), ids))
    .where("Specialite.IsBdm", "=", 1)
    .groupBy("Specialite.SpecId")
    .execute();
}

export async function getSubstanceSpecialitesCIS(
  subsNomsIDs: string | string[],
): Promise<string[]> {
  "use cache: remote";
  cacheLife("hourly");

  const ids: string[] = !Array.isArray(subsNomsIDs)
    ? [subsNomsIDs]
    : subsNomsIDs;
  const rawCISList = await pdbmMySQL
    .selectFrom("Specialite")
    .select("Specialite.SpecId")
    .where((eb) => withSubstances(eb.ref("Specialite.SpecId"), ids))
    .where("Specialite.IsBdm", "=", 1)
    .groupBy("Specialite.SpecId")
    .execute();
  return rawCISList.map((CIS) => CIS.SpecId);
}

export async function getSpecialiteMetadata(
  CIS: number,
): Promise<SpecialiteMetadata | undefined> {
  "use cache: remote";
  cacheLife("daily");

  return await db
    .selectFrom("specialites_metadata")
    .where("CIS", "=", CIS)
    .selectAll()
    .executeTakeFirst();
}
