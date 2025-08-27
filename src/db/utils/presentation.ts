import "server-cli-only";
import { cache } from "react";
import {
  PdbmMySQL,
  Presentation,
  PresentationComm,
  PresentationStat,
  PresInfoTarif,
} from "@/db/pdbmMySQL/types";
import { pdbmMySQL } from "@/db/pdbmMySQL";
import { expressionBuilder, Nullable, sql } from "kysely";
import { PresentationDetail } from "@/db/types";

export const presentationIsComm = () => {
  const eb = expressionBuilder<PdbmMySQL, "Presentation">();
  return eb.and([
    eb.or([
      eb("Presentation.CommId", "=", PresentationComm.Commercialisation),
      eb.and([
        eb("Presentation.CommId", "in", [
          PresentationComm["Arrêt"],
          PresentationComm.Suspension,
          PresentationComm["Plus d'autorisation"],
        ]),
        eb(
          "Presentation.PresCommDate",
          ">=",
          sql<Date>`DATE_ADD(NOW(),INTERVAL -730 DAY)`,
        ),
      ]),
    ]),
    eb.or([
      eb("Presentation.StatId", "is", null),
      eb("Presentation.StatId", "!=", PresentationStat.Abrogation),
      eb(
        "Presentation.PresStatDate",
        ">=",
        sql<Date>`DATE_ADD(NOW(),INTERVAL -730 DAY)`,
      ),
    ]),
  ]);
};

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
        //.where(presentationIsComm())
        .leftJoin("CEPS_Prix", "Presentation.codeCIP13", "CEPS_Prix.Cip13")
        .selectAll()
        .execute()
    ).sort((a, b) =>
      a.PPF && b.PPF ? a.PPF - b.PPF : a.PPF ? -1 : b.PPF ? 1 : 0,
    );
  },
);
