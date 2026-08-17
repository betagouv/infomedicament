"use server";
import "server-cli-only";

import { cache } from "react";
import {
  SpecComposant,
  SpecDelivrance,
  SubstanceNom,
} from "@/db/pdbmMySQL/types";
import { pdbmMySQL } from "@/db/pdbmMySQL";
import { sql } from "kysely";
import db from "@/db";
import { getFullPresentations } from "@/db/utils/presentation";
import { unstable_cache } from "next/cache";
import { withSubstances } from "./query";
import { DetailedSpecialite, ResumeSpecGroup, ResumeSpecialite, Specialite } from "@/types/SpecialiteTypes";
import { Presentation } from "@/types/PresentationTypes";
import { getComposants } from "./composants";
import { formatSpecialitesResume, formatSpecialitesResumeFromGroups } from "@/utils/specialites";
import { SpecialiteMetadata } from "../types";
import {
  mapCatalogSpecialite,
  mapDetailedSpecialite,
  VISIBLE_SPECIALITE_AVAILABILITIES,
} from "./specialiteCatalog";

export async function getNoticeRcpLastUpdated(): Promise<Date | null> {
  const result = await db
    .selectFrom("ansm_document")
    .select((eb) => eb.fn.max("date_modification").as("lastUpdated"))
    .executeTakeFirst();

  return result?.lastUpdated ?? null;
}

export const getMarketedMedicamentCount = unstable_cache(async function(): Promise<number> {
  const result = await db
    .selectFrom("ansm_specialite")
    .where("disponibilite", "in", VISIBLE_SPECIALITE_AVAILABILITIES)
    .select((eb) => eb.fn.countAll<number>().as("count"))
    .executeTakeFirstOrThrow();

  return Number(result.count);
}, ["marketed-medicament-count"], { revalidate: 3600 });

export async function getSpecialiteName(CIS: string): Promise<string> {
  const result = await db
    .selectFrom("ansm_specialite")
    .where("cis", "=", CIS)
    .select("denomination")
    .executeTakeFirst();

  return result?.denomination ?? "";
}

export const getDetailedSpecialite = cache(
  async (
    CIS: string
  ) : Promise<DetailedSpecialite | undefined> => {
  const row = await db
    .selectFrom("ansm_specialite")
    .where("cis", "=", CIS)
    .where("disponibilite", "in", VISIBLE_SPECIALITE_AVAILABILITIES)
    .selectAll()
    .executeTakeFirst();

  if (!row) return undefined;

  const [titulaires, generique] = await Promise.all([
    db
      .selectFrom("ansm_specialite_titulaire")
      .where("cis", "=", CIS)
      .select(["raison_sociale", "raison_sociale_longue"])
      .orderBy("date_debut", "desc")
      .execute(),
    row.generique
      ? db
        .selectFrom("ansm_specialite")
        .where("cis", "=", row.generique.toString())
        .select("denomination")
        .executeTakeFirst()
      : Promise.resolve(undefined),
  ]);

  const titulaireNames = titulaires
    .map((titulaire) => titulaire.raison_sociale_longue ?? titulaire.raison_sociale)
    .filter((name): name is string => Boolean(name));

  return mapDetailedSpecialite(
    row,
    titulaireNames.length > 0 ? [...new Set(titulaireNames)].join(", ") : null,
    generique?.denomination ?? null,
  );
});

export const getSpecialite = cache(async (CIS: string) => {

  const specialite: DetailedSpecialite | undefined = await getDetailedSpecialite(CIS);

  const composants: Array<SpecComposant & SubstanceNom> = 
    specialite 
      ? await getComposants(CIS)
      : [];

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

export const getAllSpecialites = cache(async function (): Promise<Specialite[]> {
  const rows = await db
    .selectFrom("ansm_specialite")
    .where("disponibilite", "in", VISIBLE_SPECIALITE_AVAILABILITIES)
    .selectAll()
    .orderBy("denomination")
    .execute();

  return rows.map(mapCatalogSpecialite);
})

export async function isPrincepsSpecialite(CIS: string): Promise<boolean> {
  const numericCis = Number(CIS);
  if (!Number.isInteger(numericCis)) return false;

  return Boolean(await db
    .selectFrom("ansm_specialite")
    .where("generique", "=", numericCis)
    .select("cis")
    .executeTakeFirst());
}

export async function getAllGenericGroupCis(): Promise<string[]> {
  const rows = await db
    .selectFrom("ansm_specialite")
    .where("generique", "is not", null)
    .select("generique")
    .distinct()
    .execute();

  return rows.flatMap(({ generique }) => generique ? [generique.toString()] : []);
}

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
): Promise<Specialite[]> {
  const ids: string[] = !Array.isArray(subsNomsIDs) ? [subsNomsIDs] : subsNomsIDs;
  return pdbmMySQL
    .selectFrom("Specialite")
    .selectAll("Specialite")
    .where((eb) => withSubstances(eb.ref("Specialite.SpecId"), ids))
    .where("Specialite.IsBdm", "=", 1)
    .groupBy("Specialite.SpecId")
    .execute();
},
  ["substance-specialites"],
  { revalidate: 3600 } // cache for one hour
);

export const getSubstanceSpecialitesCIS = unstable_cache(async function (
  subsNomsIDs: (string | string[])
): Promise<string[]> {
  const ids: string[] = !Array.isArray(subsNomsIDs) ? [subsNomsIDs] : subsNomsIDs;
  const rawCISList = await pdbmMySQL
    .selectFrom("Specialite")
    .select("Specialite.SpecId")
    .where((eb) => withSubstances(eb.ref("Specialite.SpecId"), ids))
    .where("Specialite.IsBdm", "=", 1)
    .groupBy("Specialite.SpecId")
    .execute();
  return rawCISList.map((CIS) => CIS.SpecId);
},
  ["substance-specialites-cis"],
  { revalidate: 3600 } // cache for one hour
);

export async function getSpecialiteMetadata(CIS: number): Promise<SpecialiteMetadata | undefined> {
  return await db
    .selectFrom("specialites_metadata")
    .where("CIS", "=", CIS)
    .selectAll()
    .executeTakeFirst();
};
