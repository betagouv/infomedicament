import "server-cli-only";
import { cacheLife } from "next/cache";
import {
  PdbmMySQL,
  PresentationComm,
  PresentationStat,
  PresentationRetro,
} from "@/db/pdbmMySQL/types";
import { pdbmMySQL } from "@/db/pdbmMySQL";
import { expressionBuilder, sql } from "kysely";
import { Presentation } from "@/types/PresentationTypes";
import { PresentationDetail } from "../types";
import db from "..";

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
        "Presentation.PresStatDAte",
        ">=",
        sql<Date>`DATE_ADD(NOW(),INTERVAL -730 DAY)`,
      ),
    ]),
  ]);
};

export async function getPresentations(CIS: string): Promise<Presentation[]> {
  "use cache: remote";
  cacheLife("hourly");

  const result = (
    await pdbmMySQL
      .selectFrom("Presentation")
      .where("SpecId", "=", CIS)
      .where(presentationIsComm())
      .leftJoin("CEPS_Prix", "Presentation.codeCIP13", "CEPS_Prix.Cip13")
      .leftJoin(
        "CNAM_AgreColl",
        "Presentation.codeCIP13",
        "CNAM_AgreColl.Cip13",
      )
      .selectAll()
      //  .select(({ fn, val }) => [
      //     fn<boolean>("", [val(presentationIsComm())]).as("isCommercialisee"),
      //   ])
      .execute()
  ).sort((a, b) =>
    a.PPF && b.PPF ? a.PPF - b.PPF : a.PPF ? -1 : b.PPF ? 1 : 0,
  );
  return result;
}

export async function getPresentationsDetails(
  codeCIP13List: string[],
): Promise<PresentationDetail[]> {
  "use cache: remote";
  cacheLife("hourly");

  const presentationsDetails = codeCIP13List.length
    ? await db
        .selectFrom("presentations")
        .selectAll()
        .where("presentations.codecip13", "in", codeCIP13List)
        .distinct()
        .execute()
    : [];
  return presentationsDetails;
}

export async function getPresentationsRetro(
  codeCIP13List: string[],
): Promise<PresentationRetro[]> {
  "use cache: remote";
  cacheLife("hourly");

  const presentationsRetro = codeCIP13List.length
    ? await pdbmMySQL
        .selectFrom("CNAM_Retro")
        .selectAll()
        .where("CNAM_Retro.Cip13", "in", codeCIP13List)
        .distinct()
        .execute()
    : [];
  return presentationsRetro;
}

export async function getFullPresentations(
  CIS: string,
): Promise<Presentation[]> {
  const presentations: Presentation[] = await getPresentations(CIS);
  const codesCIP13: string[] = presentations.map((p) => p.codeCIP13);
  const [presentationsDetails, presentationsRetro] = await Promise.all([
    getPresentationsDetails(codesCIP13),
    getPresentationsRetro(codesCIP13),
  ]);

  presentations.forEach((p) => {
    const details = presentationsDetails.filter(
      (d) => d.codecip13.trim() === p.codeCIP13.trim(),
    );
    p.details = details;
    const retro = presentationsRetro.filter(
      (r) => r.Cip13.trim() === p.codeCIP13.trim(),
    );
    if (retro.length > 0) {
      //Only one per presentation
      p.retro = retro[0];
    }
  });

  return presentations;
}
