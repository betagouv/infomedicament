"use server";
import "server-cli-only";

import { cacheLife } from "next/cache";
import db from "..";
import { Indication, ResumeIndication } from "../types";
import { sql } from "kysely";
import { ShortIndication } from "@/types/IndicationsTypes";

export async function getAllIndications(): Promise<Indication[]> {
  return await db.selectFrom("indications").selectAll().execute();
}

export async function getIndications(
  code: number,
): Promise<Indication | undefined> {
  "use cache: remote";
  cacheLife("daily");

  return await db
    .selectFrom("indications")
    .where("id", "=", code)
    .selectAll()
    .executeTakeFirst();
}

//Get the indications list (only ids) from specialite code CIS
export async function getSpecialiteIndications(CIS: string): Promise<number[]> {
  "use cache: remote";
  cacheLife("hourly");

  const codes = await db
    .selectFrom("indications")
    .select("id")
    .where("CIS", "&&", Array([CIS]))
    .distinct()
    .execute();
  return codes.map((code) => code.id);
}

//Get the pathologies list (only ids) from specialite code CIS
export async function getSpecialitePathologies(CIS: string): Promise<number[]> {
  "use cache: remote";
  cacheLife("hourly");

  const rawCodes = await db
    .selectFrom("indications")
    .select("codePatho")
    .where("CIS", "&&", Array([CIS]))
    .where("codePatho", "is not", null)
    .distinct()
    .execute();
  const codes: number[] = rawCodes
    .map((code) => code.codePatho)
    .filter((code) => code !== undefined);
  return codes;
}

export async function getSpecialitesIndications(
  CIS: string[],
): Promise<ShortIndication[]> {
  "use cache: remote";
  cacheLife("hourly");

  const indications: ShortIndication[] = await db
    .selectFrom("indications")
    .where("CIS", "&&", Array(CIS))
    .select(["id as idIndication", "nom as nomIndication"])
    .execute();
  return indications;
}

export async function getIndicationsResumeWithLetter(
  letter: string,
): Promise<ResumeIndication[]> {
  "use cache: remote";
  cacheLife("daily");

  const result: ResumeIndication[] = await db
    .selectFrom("resume_indications")
    .selectAll()
    .where(({ eb, ref }) =>
      eb(
        sql<string>`upper(${ref("nomIndication")})`,
        "like",
        `${letter.toUpperCase()}%`,
      ),
    )
    .orderBy("nomIndication")
    .execute();
  return result;
}
