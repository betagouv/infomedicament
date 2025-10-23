"use server";

import "server-cli-only";
import { unstable_cache } from "next/cache";
import { pdbmMySQL } from "@/db/pdbmMySQL";
import { Patho } from "../pdbmMySQL/types";
import { cache } from "react";
import db from "..";
import { ResumePatho } from "../types";
import { sql } from "kysely";

export async function getPatho(code: string): Promise<Patho | undefined> {
  return await pdbmMySQL
    .selectFrom("Patho")
    .selectAll()
    .where("codePatho", "=", code)
    .executeTakeFirst();
}

// Get the specialites list from code patho
export const getPathoSpecialites = unstable_cache(async function (code: string) {
  return pdbmMySQL
    .selectFrom("Specialite")
    .selectAll("Specialite")
    .leftJoin("Spec_Patho", "Specialite.SpecId", "Spec_Patho.SpecId")
    .where("Spec_Patho.codePatho", "=", code)
    .execute();
});

//Get the code patho list from specialite code CIS
export const getSpecialitePatho = unstable_cache(async function (CIS: string): Promise<string[]> {
  return getSpecialitesPatho([CIS]);
});
export const getSpecialitesPatho = cache(async function (CIS: string[]): Promise<string[]> {
  const rawCodePatho = await pdbmMySQL
    .selectFrom("Spec_Patho")
    .select("Spec_Patho.codePatho")
    .leftJoin("Specialite", "Spec_Patho.SpecId", "Specialite.SpecId")
    .where("Specialite.SpecId", "in", CIS)
    .distinct()
    .execute();
  return rawCodePatho.map((code) => code.codePatho);
});

export const getAllPathos = cache(async function(): Promise<Patho[]> {
  return await pdbmMySQL
    .selectFrom("Patho")
    .selectAll()
    .execute();
});

export const getAllPathoWithSpecialites = cache(async function() {
  return await pdbmMySQL
    .selectFrom("Patho")
    .innerJoin("Spec_Patho", "Patho.codePatho", "Spec_Patho.codePatho")
    .innerJoin("Specialite", "Spec_Patho.SpecId", "Specialite.SpecId")
    .selectAll("Patho")
    .select("Specialite.SpecDenom01")
    .orderBy("Specialite.SpecDenom01")
    .execute();
});

export const getPathologiesResumeWithLetter = cache(async function(letter: string): Promise<ResumePatho[]> {
  const result:ResumePatho[] = await db
    .selectFrom("resume_pathologies")
    .selectAll()
    .where(({eb, ref}) => eb(
      sql<string>`upper(${ref("NomPatho")})`, "like", `${letter.toUpperCase()}%`
    ))
    .orderBy("NomPatho")
    .execute();
  return result;
});
