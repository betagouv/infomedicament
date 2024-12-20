import { cache } from "react";
import { notFound } from "next/navigation";
import {
  Presentation,
  PresentationComm,
  PresentationStat,
  PresInfoTarif,
  SpecComposant,
  SpecDelivrance,
  SpecElement,
  Specialite,
  SubstanceNom,
} from "@/db/pdbmMySQL/types";
import { pdbmMySQL } from "@/db/pdbmMySQL";
import { Nullable, sql } from "kysely";
import db, { PresentationDetail } from "@/db/index";

export const getPresentations = cache(
  async (
    CIS: string,
  ): Promise<
    (Presentation &
      Nullable<PresInfoTarif> & { details?: PresentationDetail })[]
  > => {
    return (
      await pdbmMySQL
        .selectFrom("Presentation")
        .where("SpecId", "=", CIS)
        .where(({ eb }) =>
          eb.or([
            eb("CommId", "=", PresentationComm.Commercialisation),
            eb.and([
              eb("CommId", "in", [
                PresentationComm["Arrêt"],
                PresentationComm.Suspension,
                PresentationComm["Plus d'autorisation"],
              ]),
              eb(
                "PresCommDate",
                ">=",
                sql<Date>`DATE_ADD(NOW(),INTERVAL -730 DAY)`,
              ),
            ]),
          ]),
        )
        .where(({ eb }) =>
          eb.or([
            eb("StatId", "is", null),
            eb("StatId", "!=", PresentationStat.Abrogation),
            eb(
              "PresStatDate",
              ">=",
              sql<Date>`DATE_ADD(NOW(),INTERVAL -730 DAY)`,
            ),
          ]),
        )
        .leftJoin(
          "CNAM_InfoTarif",
          "Presentation.codeCIP13",
          "CNAM_InfoTarif.Cip13",
        )
        .selectAll()
        .execute()
    ).sort((a, b) =>
      a.Prix && b.Prix
        ? parseFloat(a.Prix.replace(",", ".")) -
          parseFloat(b.Prix.replace(",", "."))
        : a.Prix
          ? -1
          : b.Prix
            ? 1
            : 0,
    );
  },
);

export const getSpecialite = cache(async (CIS: string) => {
  const specialite: Specialite | undefined = await pdbmMySQL
    .selectFrom("Specialite")
    .where("SpecId", "=", CIS)
    .selectAll()
    .executeTakeFirst();

  if (!specialite) return notFound();

  const elements: SpecElement[] = await pdbmMySQL
    .selectFrom("Element")
    .where("SpecId", "=", CIS)
    .selectAll()
    .execute();

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

  const presentations = await getPresentations(CIS);

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
