"use server";

import "server-cli-only";
import { cache } from "react";
import {
  Presentation,
  PresInfoTarif,
  SpecComposant,
  SpecDelivrance,
  SpecElement,
  Specialite,
  SubstanceNom,
} from "@/db/pdbmMySQL/types";
import { pdbmMySQL } from "@/db/pdbmMySQL";
import { Nullable, sql } from "kysely";
import { PresentationDetail, ResumeSpecialiteDB } from "@/db/types";
import db from "@/db";
import { getPresentations } from "@/db/utils";
import { unstable_cache } from "next/cache";
import { withSubstances } from "./query";

export const getSpecialite = cache(async (CIS: string) => {
  const specialiteP: Promise<Specialite | undefined> = pdbmMySQL
    .selectFrom("Specialite")
    .where("SpecId", "=", CIS)
    .selectAll()
    .executeTakeFirst();

  const presentationsP: Promise<
    (Presentation &
      Nullable<PresInfoTarif> & { details?: PresentationDetail })[]
  > = getPresentations(CIS);
  const elementsP: Promise<SpecElement[]> = pdbmMySQL
    .selectFrom("Element")
    .where("SpecId", "=", CIS)
    .selectAll()
    .execute();

  const [specialite, presentations, elements] = await Promise.all([
    specialiteP,
    presentationsP,
    elementsP,
  ]);

  const composants: Array<SpecComposant & SubstanceNom> = (
    await Promise.all(
      elements.map((el) =>
        pdbmMySQL
          .selectFrom("Composant")
          .where((eb) =>
            eb.and([eb("SpecId", "=", CIS), eb("ElmtNum", "=", el.ElmtNum)]),
          )
          .innerJoin("Subs_Nom", "Composant.NomId", "Subs_Nom.NomId")
          .selectAll()
          .execute(),
      ),
    )
  ).flat();

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

export const getResumeSpecialitesWithLetter = cache(async function (letter: string): Promise<ResumeSpecialiteDB[]> {
  return await db
    .selectFrom("resume_specialites")
    .where(({eb, ref}) => eb(
      sql<string>`upper(${ref("groupName")})`, "like", `${letter.toUpperCase()}%`
    ))
    .selectAll()
    .orderBy("groupName")
    .execute();
});

export const getResumeSpecialitesWithPatho = cache(async function (codePatho: string): Promise<ResumeSpecialiteDB[]> {
  return await db
    .selectFrom("resume_specialites")
    .where("pathosCodes", "&&", Array([codePatho]))
    .selectAll()
    .orderBy("groupName")
    .execute();
});

export const getResumeSpecialitesWithCIS = cache(async function (CISList: string[]): Promise<ResumeSpecialiteDB[]> {
  if(CISList.length === 0) return [];
  return await db
    .selectFrom("resume_specialites")
    .where("CISList", "&&", Array(CISList))
    .selectAll()
    .orderBy("groupName")
    .execute();
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