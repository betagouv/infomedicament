"use server";

import { cache } from "react";
import { ResumeGeneric } from "../types";
import db from "..";
import { sql } from "kysely";
import { AnsmSpecialiteWithStatus } from "@/types/SpecialiteTypes";
import { computeStatutBdm } from "@/utils/specialites";

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

export async function getGroupeGene(CIS: string): Promise<{ SpecId: string; LibLong: string } | undefined> {
  const princeps = await db
    .selectFrom("ansm_specialite")
    .where("cis", "=", CIS)
    .select(["cis", "denomination"])
    .executeTakeFirst();

  if (!princeps?.denomination) return undefined;

  const hasGenerics = await db
    .selectFrom("ansm_specialite")
    .where("generique", "=", CIS)
    .select("cis")
    .limit(1)
    .executeTakeFirst();

  if (!hasGenerics) return undefined;

  return { SpecId: CIS, LibLong: princeps.denomination };
}

export async function getGeneriques(CIS: string): Promise<AnsmSpecialiteWithStatus[]> {
  const rows = await db
    .selectFrom("ansm_specialite")
    .where("generique", "=", CIS)
    .where("disponibilite", "!=", "INDISPONIBLE")
    .selectAll()
    .execute();

  return rows.map((row) => ({
    ...row,
    StatutBdm: computeStatutBdm(row),
    ProcId: row.procedure?.toString() ?? "",
  }));
}
