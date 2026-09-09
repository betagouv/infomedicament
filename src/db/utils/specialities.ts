"use server";
import { cacheLife } from "next/cache";
import "server-cli-only";


import { sql } from "kysely";
import db from "@/db";
import { getFullPresentations } from "@/db/utils/presentation";

import {
  DelivranceCondition,
  DetailedSpecialite,
  ResumeSpecGroup,
  ResumeSpecialite,
  Specialite,
} from "@/types/SpecialiteTypes";
import type { CompositionComponent } from "@/types/SubstanceTypes";
import { Presentation } from "@/types/PresentationTypes";
import { getComposants } from "./composants";
import {
  formatSpecialitesResume,
  formatSpecialitesResumeFromGroups,
} from "@/utils/specialites";
import { SpecialiteMetadata } from "../types";
import {
  mapCatalogSpecialite,
  mapDetailedSpecialite,
  VISIBLE_SPECIALITE_AVAILABILITIES,
} from "./specialiteCatalog";
import { getEenLabel } from "./specialiteEen";
import { getGenericGroupMembership } from "./generics";
import { getCisMatchingSubstanceSet } from "./substances";

export async function getNoticeRcpLastUpdated(): Promise<Date | null> {
  "use cache: remote";
  cacheLife("hourly");
  const result = await db
    .selectFrom("ansm_document")
    .select((eb) => eb.fn.max("date_modification").as("lastUpdated"))
    .executeTakeFirst();

  return result?.lastUpdated ?? null;
}

export async function getMarketedMedicamentCount(): Promise<number> {
  "use cache: remote";
  cacheLife("hourly");
    const result = await db
      .selectFrom("ansm_specialite")
      .where("disponibilite", "in", VISIBLE_SPECIALITE_AVAILABILITIES)
      .select((eb) => eb.fn.countAll<number>().as("count"))
      .executeTakeFirstOrThrow();

    return Number(result.count);
  }

export async function getSpecialiteName(CIS: string): Promise<string> {
  const result = await db
    .selectFrom("ansm_specialite")
    .where("cis", "=", CIS)
    .select("denomination")
    .executeTakeFirst();

  return result?.denomination ?? "";
}

export async function getDetailedSpecialite(CIS: string): Promise<DetailedSpecialite | undefined> {
  "use cache: remote";
  cacheLife("hourly");
    const row = await db
      .selectFrom("ansm_specialite")
      .where("cis", "=", CIS)
      .where("disponibilite", "in", VISIBLE_SPECIALITE_AVAILABILITIES)
      .selectAll()
      .executeTakeFirst();

    if (!row) return undefined;

    const genericGroupMembershipPromise = getGenericGroupMembership(CIS);
    const [
      titulaires,
      genericGroupMembership,
      importedReference,
      statusEvent,
      excipientsEffetNotoire,
    ] = await Promise.all([
      db
        .selectFrom("ansm_specialite_titulaire")
        .where("cis", "=", CIS)
        .select(["raison_sociale", "raison_sociale_longue"])
        .orderBy("date_debut", "desc")
        .execute(),
      genericGroupMembershipPromise,
      row.procedure === "IMPORTATION_PARALLELE" && row.generique
        ? db
            .selectFrom("ansm_specialite")
            .where("cis", "=", row.generique.toString())
            .select("denomination")
            .executeTakeFirst()
        : Promise.resolve(undefined),
      row.statut_amm === "ABROGEE"
        ? db
            .selectFrom("ansm_specialite_evenement")
            .where("cis", "=", CIS)
            .where("code_evenement", "=", 33)
            .where("date_evenement", "is not", null)
            .select("date_evenement")
            .orderBy("date_evenement", "desc")
            .executeTakeFirst()
        : Promise.resolve(undefined),
      row.een === "PRESENTS" ? getEenLabel(CIS) : Promise.resolve(null),
    ]);

    const titulaireNames = titulaires
      .map(
        (titulaire) =>
          titulaire.raison_sociale_longue ?? titulaire.raison_sociale,
      )
      .filter((name): name is string => Boolean(name));

    const referenceSpecialite =
      genericGroupMembership?.referenceCis &&
      genericGroupMembership.referenceName
        ? {
            cis: genericGroupMembership.referenceCis,
            name: genericGroupMembership.referenceName,
          }
        : row.procedure === "IMPORTATION_PARALLELE" &&
            row.generique &&
            importedReference?.denomination
          ? {
              cis: row.generique.toString(),
              name: importedReference.denomination,
            }
          : null;

    return mapDetailedSpecialite(
      row,
      titulaireNames.length > 0
        ? [...new Set(titulaireNames)].join(", ")
        : null,
      genericGroupMembership?.codeGroupe ?? null,
      referenceSpecialite,
      statusEvent?.date_evenement ?? null,
      excipientsEffetNotoire,
    );
  }

export async function getSpecialite(CIS: string) {
  "use cache: remote";
  cacheLife("hourly");
  const specialite: DetailedSpecialite | undefined =
    await getDetailedSpecialite(CIS);

  const composants: CompositionComponent[] = specialite
    ? await getComposants(CIS)
    : [];

  const presentations: Presentation[] = specialite
    ? await getFullPresentations(CIS)
    : [];

  const delivrance: DelivranceCondition[] =
    specialite
      ? await db
        .selectFrom("ansm_specialite_delivrance")
        .where("ansm_specialite_delivrance.cis", "=", CIS)
        .innerJoin(
          "ansm_delivrance",
          "ansm_specialite_delivrance.code_delivrance",
          "ansm_delivrance.code",
        )
        .select([
          "ansm_delivrance.code as code",
          "ansm_delivrance.libelle_court as shortLabel",
          "ansm_delivrance.libelle_long as longLabel",
        ])
        .orderBy("ansm_delivrance.libelle_long")
        .execute()
      : [];

  return {
    specialite,
    composants,
    presentations,
    delivrance,
  };
}

export async function getAllSpecialites(): Promise<
  Specialite[]
> {
  "use cache: remote";
  cacheLife("daily");
  const rows = await db
    .selectFrom("ansm_specialite")
    .where("disponibilite", "in", VISIBLE_SPECIALITE_AVAILABILITIES)
    .selectAll()
    .orderBy("denomination")
    .execute();

  return rows.map((row) => mapCatalogSpecialite(row));
}

export async function getResumeSpecsGroupsWithLetter(letter: string): Promise<ResumeSpecGroup[]> {
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

export async function getResumeSpecsGroupsWithIndication(indicationsIds: number): Promise<ResumeSpecGroup[]> {
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

export async function getResumeSpecsGroupsWithCIS(CISList: string[]): Promise<ResumeSpecGroup[]> {
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

export async function getResumeSpecialitesWithCIS(CISList: string[]): Promise<ResumeSpecialite[]> {
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

export async function getResumeSpecsGroupsWithCISSubsIds(CISList: string[], SubsIds: string[]): Promise<ResumeSpecGroup[]> {
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

export async function getSubstanceSpecialites(subsNomsIDs: string | string[]): Promise<Specialite[]> {
  "use cache: remote";
  cacheLife("hourly");
    const ids: string[] = !Array.isArray(subsNomsIDs)
      ? [subsNomsIDs]
      : subsNomsIDs;
    const cisList = await getCisMatchingSubstanceSet(ids);
    if (cisList.length === 0) return [];
    const rows = await db
      .selectFrom("ansm_specialite")
      .where("cis", "in", cisList)
      .where("disponibilite", "in", VISIBLE_SPECIALITE_AVAILABILITIES)
      .selectAll()
      .execute();

    return rows.map((row) => mapCatalogSpecialite(row));
  }

export async function getSubstanceSpecialitesCIS(subsNomsIDs: string | string[]): Promise<string[]> {
  "use cache: remote";
  cacheLife("hourly");
    const ids: string[] = !Array.isArray(subsNomsIDs)
      ? [subsNomsIDs]
      : subsNomsIDs;
    const cisList = await getCisMatchingSubstanceSet(ids);
    if (cisList.length === 0) return [];
    const rows = await db
      .selectFrom("ansm_specialite")
      .where("cis", "in", cisList)
      .where("disponibilite", "in", VISIBLE_SPECIALITE_AVAILABILITIES)
      .select("cis")
      .execute();
    return rows.map((row) => row.cis);
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
