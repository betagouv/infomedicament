"use server";
import "server-cli-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import db from "..";
import { Pathology, ResumePatho } from "../types";
import { sql } from "kysely";
import { ShortPatho } from "@/types/PathoTypes";

export async function getPatho(code: string): Promise<Pathology | undefined> {
  return await db
    .selectFrom("pathologies")
    .where("id", "=", code)
    .selectAll()
    .executeTakeFirst();
}

//Get the code patho list from specialite code CIS
export const getSpecialitePatho = unstable_cache(
  async function (CIS: string): Promise<string[]> {
    const codes = await db
      .selectFrom("pathologies")
      .select("id")
      .where("CIS", "&&", Array([CIS]))
      .distinct()
      .execute();
    return codes.map((code) => code.id);
  },
  ["specialite-patho"],
  { revalidate: 3600 } // cache for 1 hour
);

export const getSpecialitesPatho = cache(async function (CIS: string[]): Promise<ShortPatho[]> {
  const pathos: ShortPatho[] = await db
    .selectFrom("pathologies")
    .where("CIS", "&&", Array(CIS))
    .select(["id as idPatho", "nom as nomPatho"])
    .execute();
  return pathos;
});

export const getPathologiesResumeWithLetter = cache(async function (letter: string): Promise<ResumePatho[]> {
  const result: ResumePatho[] = await db
    .selectFrom("resume_pathologies")
    .selectAll()
    .where(({ eb, ref }) => eb(
      sql<string>`upper(${ref("nomPatho")})`, "like", `${letter.toUpperCase()}%`
    ))
    .orderBy("nomPatho")
    .execute();
  return result;
});