"use server";

import "server-cli-only";
import { cache } from "react";
import {
  SpecComposant,
  SpecDelivrance,
  Specialite,
  SubstanceNom,
} from "@/db/pdbmMySQL/types";
import { pdbmMySQL } from "@/db/pdbmMySQL";
import { sql } from "kysely";
import db from "@/db";
import { getPresentations } from "@/db/utils";
import { unstable_cache } from "next/cache";
import { withSubstances } from "./query";
import { DetailedSpecialite, ResumeSpecGroup } from "@/types/SpecialiteTypes";
import { Presentation } from "@/types/PresentationTypes";
import { getComposants } from "./composants";
import { formatSpecialitesResumeFromGroups } from "@/utils/specialites";

export async function getSpecialiteName(CIS: string): Promise<string>{
  const result = await pdbmMySQL
    .selectFrom("Specialite")
    .where("SpecId", "=", CIS)
    .select("SpecDenom01")
    .executeTakeFirst();

  return result ? result.SpecDenom01 : "";
}

export const getDetailedSpecialite = cache(
  async (
    CIS: string
  ) : Promise<DetailedSpecialite | undefined> => {
  const specialite: DetailedSpecialite | undefined = await pdbmMySQL
    .selectFrom("Specialite")
    .leftJoin("StatutAdm", "StatutAdm.StatId", "Specialite.StatId")
    .leftJoin("StatutComm", "StatutComm.CommId", "Specialite.CommId")
    .leftJoin("Spec_Delivrance", "Spec_Delivrance.SpecId", "Specialite.SpecId")
    .leftJoin("DicoDelivrance", "DicoDelivrance.DelivId", "Spec_Delivrance.DelivId")
    .leftJoin("Spec_Titu", "Spec_Titu.SpecId", "Specialite.SpecId")
    .leftJoin("Titulaire", "Titulaire.TituId", "Spec_Titu.TituId")
    .leftJoin ("Specialite as GenSpecialite", "GenSpecialite.SpecId", "Specialite.SpecId")
    .where("Specialite.SpecId", "=", CIS)
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
    .select(({ fn }) => [
      fn<string[]>("JSON_ARRAYAGG", ["DicoDelivrance.DelivCourt"]).as("deliveranceList"),
    ])
    .groupBy(["Specialite.SpecId"]) //Nécessaire pour le JSON_ARRAYAGG
    .distinct()
    .executeTakeFirst();

  return specialite;
});

export const getSpecialite = cache(async (CIS: string) => {

  const specialite: DetailedSpecialite | undefined = await getDetailedSpecialite(CIS);

  const composants: Array<SpecComposant & SubstanceNom> = await getComposants(CIS);

  const presentations: Presentation[] = await getPresentations(CIS);
  const presentationsDetails = presentations.length
    ? await db
        .selectFrom("presentations")
        .select([
          "codecip13",
          "nomelement",
          "nbrrecipient",
          "recipient",
          "caraccomplrecip",
          "qtecontenance",
          "unitecontenance",
        ])
        .where(
          "presentations.codecip13",
          "in",
          presentations.map((p) => p.codeCIP13),
        )
        .groupBy([
          "codecip13",
          "nomelement",
          "nbrrecipient",
          "recipient",
          "caraccomplrecip",
          "qtecontenance",
          "unitecontenance",
        ])
        .execute()
    : [];

  presentations.map((p) => {
    const details = presentationsDetails.find(
      (d) => d.codecip13.trim() === p.codeCIP13.trim(),
    );
    if (details) {
      p.details = details;
    }
  });

  const delivrance: SpecDelivrance[] = await pdbmMySQL
    .selectFrom("Spec_Delivrance")
    .where("SpecId", "=", CIS)
    .innerJoin(
      "DicoDelivrance",
      "Spec_Delivrance.DelivId",
      "DicoDelivrance.DelivId",
    )
    .selectAll()
    .execute();

  return {
    specialite,
    composants,
    presentations,
    delivrance,
  };
});

export const getAllSpecialites = cache(async function() {
  return await pdbmMySQL
    .selectFrom("Specialite")
    .selectAll()
    .distinct()
    .orderBy("SpecDenom01")
    .execute();
})

export const getResumeSpecsGroupsWithLetter = cache(async function (letter: string): Promise<ResumeSpecGroup[]> {
  const result = await db
    .selectFrom("resume_medicaments")
    .where(({eb, ref}) => eb(
      sql<string>`upper(${ref("groupName")})`, "like", `${letter.toUpperCase()}%`
    ))
    .selectAll()
    .orderBy("groupName")
    .execute();
  return formatSpecialitesResumeFromGroups(result);
});

export const getResumeSpecsGroupsWithPatho = cache(async function (codePatho: string): Promise<ResumeSpecGroup[]> {
  const result = await db
    .selectFrom("resume_medicaments")
    .where("pathosCodes", "&&", Array([codePatho]))
    .selectAll()
    .orderBy("groupName")
    .execute();
  return formatSpecialitesResumeFromGroups(result);
});

export const getResumeSpecsGroupsWithCIS = cache(async function (CISList: string[]): Promise<ResumeSpecGroup[]> {
  if(CISList.length === 0) return [];
  const result = await db
    .selectFrom("resume_medicaments")
    .where("CISList", "&&", Array(CISList))
    .selectAll()
    .orderBy("groupName")
    .execute();
  return formatSpecialitesResumeFromGroups(result);
});

export const getResumeSpecsGroupsWithCISSubsIds = cache(
  async function (
    CISList: string[], 
    SubsIds: string[]
  ): Promise<ResumeSpecGroup[]> {
    if(CISList.length === 0) return [];
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
): Promise<Specialite[]> {
  const ids: string[] = !Array.isArray(subsNomsIDs) ? [subsNomsIDs] : subsNomsIDs;
  return pdbmMySQL
    .selectFrom("Specialite")
    .selectAll("Specialite")
    .where((eb) => withSubstances(eb.ref("Specialite.SpecId"), ids))
    .groupBy("Specialite.SpecId")
    .execute();
});

export const getSubstanceSpecialitesCIS = unstable_cache(async function (
  subsNomsIDs: (string | string[])
): Promise<string[]> {
  const ids: string[] = !Array.isArray(subsNomsIDs) ? [subsNomsIDs] : subsNomsIDs;
  const rawCISList = await pdbmMySQL
    .selectFrom("Specialite")
    .select("Specialite.SpecId")
    .where((eb) => withSubstances(eb.ref("Specialite.SpecId"), ids))
    .groupBy("Specialite.SpecId")
    .execute();
  return rawCISList.map((CIS) => CIS.SpecId);
});