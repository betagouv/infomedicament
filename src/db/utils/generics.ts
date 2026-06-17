"use server";

import { cache } from "react";
import { ResumeGeneric } from "../types";
import db from "..";
import { sql } from "kysely";
import { pdbmMySQL } from "../pdbmMySQL";
import { GroupeGene, Specialite } from "../pdbmMySQL/types";

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

export async function getGroupeGene(CIS: string): Promise<GroupeGene[]> {
  return await pdbmMySQL
    .selectFrom("GroupeGene as specGene")
    .innerJoin("GroupeGene as groupeGene", "specGene.idGrp", 'groupeGene.idGrp')
    .where("specGene.SpecId", "=", CIS)
    .where("groupeGene.codeStat", "=", 0)
    .selectAll("groupeGene")
    .orderBy("groupeGene.rangSpec")
    .execute();
}

export async function getGeneriques(CIS: string): Promise<Specialite[]> {
  return (
    pdbmMySQL
      .selectFrom("Specialite")
      .where("SpecGeneId", "=", CIS)
      .where("SpecId", "!=", CIS)
      .where("IsBdm", "=", 1)
      .selectAll()
      .execute()
  );
}