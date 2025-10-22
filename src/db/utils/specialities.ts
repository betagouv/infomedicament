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
import { PresentationDetail, ResumeSpecialite } from "@/db/types";
import db from "@/db";
import { getPresentations } from "@/db/utils";

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

export const getSpecialitesResumeWithLetter = cache(async function (letter: string): Promise<ResumeSpecialite[]> {
  return await db
    .selectFrom("resume_specialites")
    .where(({eb, ref}) => eb(
      sql<string>`upper(${ref("groupName")})`, "like", `${letter.toUpperCase()}%`
    ))
    .selectAll()
    .orderBy("groupName")
    .execute();
});