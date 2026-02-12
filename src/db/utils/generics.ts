"use server";

import { cache } from "react";
import { ResumeGeneric } from "../types";
import db from "..";
import { sql } from "kysely";
import { pdbmMySQL } from "../pdbmMySQL";
import { Specialite } from "../pdbmMySQL/types";

export const getGenericsResumeWithLetter = cache(async function(letter: string): Promise<ResumeGeneric[]> {
  const result:ResumeGeneric[] = await db
    .selectFrom("resume_generiques")
    .selectAll()
    .where(({eb, ref}) => eb(
      sql<string>`upper(${ref("SpecName")})`, "like", `${letter.toUpperCase()}%`
    ))
    .distinct()
    .orderBy("SpecName")
    .execute();
  return result;
});

export async function getGroupeGene(CIS: string) {
  return pdbmMySQL
    .selectFrom("GroupeGene")
    .where("SpecId", "=", CIS)
    .selectAll("GroupeGene")
    .executeTakeFirst();
}

export async function getGeneriques(CIS: string): Promise<Specialite[]> {
  return (
    pdbmMySQL
      .selectFrom("Specialite")
      .selectAll()
      .where("SpecGeneId", "=", CIS)
      .where("SpecId", "!=", CIS)
      .where("Specialite.IsBdm", "=", 1)
      .execute()
  );
}