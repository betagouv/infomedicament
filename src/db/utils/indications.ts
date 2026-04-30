"use server";
import "server-cli-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import db from "..";
import { Indication, ResumeIndication } from "../types";
import { sql } from "kysely";
import { ShortIndication } from "@/types/IndicationsTypes";

export async function getAllIndications(): Promise<Indication[]> {
  return await db
    .selectFrom("indications")
    .selectAll()
    .execute();
}

export async function getIndications(code: number): Promise<Indication | undefined> {
  return await db
    .selectFrom("indications")
    .where("id", "=", code)
    .selectAll()
    .executeTakeFirst();
}

//Get the indications list (only ids) from specialite code CIS
export const getSpecialiteIndications = unstable_cache(
  async function (CIS: string): Promise<number[]> {
    const codes = await db
      .selectFrom("indications")
      .select("id")
      .where("CIS", "&&", Array([CIS]))
      .distinct()
      .execute();
    return codes.map((code) => code.id);
  },
  ["specialite-indications"],
  { revalidate: 3600 } // cache for 1 hour
);

//Get the pathologies list (only ids) from specialite code CIS
export const getSpecialitePathologies = unstable_cache(
  async function (CIS: string): Promise<number[]> {
    const rawCodes = await db
      .selectFrom("indications")
      .select("codePatho")
      .where("CIS", "&&", Array([CIS]))
      .where("codePatho", "is not", null)
      .distinct()
      .execute();
    const codes: number[] = rawCodes
      .map((code) => code.codePatho)
      .filter((code) => code !== undefined)
    return codes;
  },
  ["specialite-pathologies"],
  { revalidate: 3600 } // cache for 1 hour
);

export const getSpecialitesIndications = cache(async function (CIS: string[]): Promise<ShortIndication[]> {
  const indications: ShortIndication[] = await db
    .selectFrom("indications")
    .where("CIS", "&&", Array(CIS))
    .select(["id as idIndication", "nom as nomIndication"])
    .execute();
  return indications;
});

export const getIndicationsResumeWithLetter = cache(async function (letter: string): Promise<ResumeIndication[]> {
  const result: ResumeIndication[] = await db
    .selectFrom("resume_indications")
    .selectAll()
    .where(({ eb, ref }) => eb(
      sql<string>`upper(${ref("nomIndication")})`, "like", `${letter.toUpperCase()}%`
    ))
    .orderBy("nomIndication")
    .execute();
  return result;
});